import { PutObjectCommand } from "@aws-sdk/client-s3";
import { StatusCodes } from "http-status-codes";
import { ObjectId } from "mongodb";
import { cardModel } from "~/models/cardModel";
import { columnModel } from "~/models/columnModel";
import { s3 } from "~/utils/configAWS";
import {
  assertBoardMember,
  assertBoardMemberByCardId,
  assertCanReadBoardByCardId,
} from "~/utils/boardPermissions";
import { sanitizeFilename } from "~/utils/helpers";
import { ApiError } from "~/utils/types";

const getActor = (user) => ({
  actorId: user?._id?.toString() || null,
  actorName: user?.username || "Someone",
  actorAvatar: user?.avatar || null,
});

const createActivity = (user, action, message) => ({
  ...getActor(user),
  action,
  message,
});

const getUpdateActivities = (card, reqBody, user) => {
  const activities = [];

  if (reqBody.title && reqBody.title !== card.title) {
    activities.push(
      createActivity(user, "update_title", `renamed this card to "${reqBody.title}"`)
    );
  }

  if (
    Object.prototype.hasOwnProperty.call(reqBody, "description") &&
    reqBody.description !== card.description
  ) {
    activities.push(createActivity(user, "update_description", "updated the description"));
  }

  if (
    Object.prototype.hasOwnProperty.call(reqBody, "completed") &&
    reqBody.completed !== card.completed
  ) {
    activities.push(
      createActivity(
        user,
        "update_completed",
        reqBody.completed ? "marked this card complete" : "marked this card incomplete"
      )
    );
  }

  if (Object.prototype.hasOwnProperty.call(reqBody, "labels")) {
    activities.push(createActivity(user, "update_labels", "updated labels"));
  }

  if (
    Object.prototype.hasOwnProperty.call(reqBody, "startDate") ||
    Object.prototype.hasOwnProperty.call(reqBody, "dueDate")
  ) {
    activities.push(createActivity(user, "update_dates", "updated dates"));
  }

  if (Object.prototype.hasOwnProperty.call(reqBody, "checklists")) {
    activities.push(createActivity(user, "update_checklist", "updated checklist"));
  }

  if (
    Object.prototype.hasOwnProperty.call(reqBody, "cover") &&
    reqBody.cover !== card.cover
  ) {
    activities.push(createActivity(user, "update_cover", "updated the cover"));
  }

  return activities;
};

const createNew = async (reqBody, user) => {
  await assertBoardMember(reqBody.boardId, user?._id);
  const createdCard = await cardModel.createNew(reqBody);
  const newCardId = createdCard.insertedId;

  const getNewCard = await cardModel.findOneById(new ObjectId(newCardId));

  await columnModel.pushCardOrderIds(getNewCard.columnId.toString(), newCardId);
  return await cardModel.pushActivity(
    newCardId,
    createActivity(user, "create_card", "created this card")
  );
};

const getDetails = async (cardId, userId) => {
  return await assertCanReadBoardByCardId(cardId, userId);
};

const update = async (cardId, reqBody, user) => {
  if (!ObjectId.isValid(cardId)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid cardId!");
  }
  const card = await assertBoardMemberByCardId(cardId, user?._id);
  const activities = getUpdateActivities(card, reqBody, user);
  let updatedCard = await cardModel.update(cardId, reqBody);

  if (!updatedCard) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Card update failed!");
  }

  if (activities.length) {
    updatedCard = await cardModel.pushActivities(cardId, activities);
  }

  return updatedCard;
};

const addComment = async (cardId, reqBody, user) => {
  if (!ObjectId.isValid(cardId)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid cardId!");
  }

  await assertBoardMemberByCardId(cardId, user?._id);

  if (!reqBody.authorName || !reqBody.content) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Author name and content are required!"
    );
  }

  let updatedCard = await cardModel.addComment(cardId, {
    ...reqBody,
    authorId: user?._id?.toString() || null,
    authorName: reqBody.authorName || user?.username,
    avatar: reqBody.avatar || user?.avatar || null,
  });
  if (!updatedCard) {
    throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, "Failed to add comment!");
  }
  updatedCard = await cardModel.pushActivity(
    cardId,
    createActivity(user, "add_comment", "commented on this card")
  );

  return updatedCard;
};

const updateComment = async (cardId, commentId, reqBody, user) => {
  if (!ObjectId.isValid(cardId)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid cardId!");
  }

  if (!ObjectId.isValid(commentId)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid commentId!");
  }

  await assertBoardMemberByCardId(cardId, user?._id);

  const existingComment = await cardModel.getCommentById(cardId, commentId);
  if (!existingComment) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Comment not found!");
  }

  if (!reqBody.content) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Content is required!");
  }

  const updateData = { content: reqBody.content };

  let updatedCard = await cardModel.updateComment(cardId, commentId, updateData);
  if (!updatedCard) {
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      "Failed to update comment!"
    );
  }
  updatedCard = await cardModel.pushActivity(
    cardId,
    createActivity(user, "update_comment", "edited a comment")
  );

  return updatedCard;
};

const deleteComment = async (cardId, commentId, user) => {
  if (!ObjectId.isValid(cardId)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid cardId!");
  }

  if (!ObjectId.isValid(commentId)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid commentId!");
  }

  await assertBoardMemberByCardId(cardId, user?._id);

  const existingComment = await cardModel.getCommentById(cardId, commentId);
  if (!existingComment) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Comment not found!");
  }

  let updatedCard = await cardModel.deleteComment(cardId, commentId);
  if (!updatedCard) {
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      "Failed to delete comment!"
    );
  }
  updatedCard = await cardModel.pushActivity(
    cardId,
    createActivity(user, "delete_comment", "deleted a comment")
  );

  return updatedCard;
};

const getComments = async (cardId, userId) => {
  if (!ObjectId.isValid(cardId)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid cardId!");
  }

  await assertCanReadBoardByCardId(cardId, userId);

  const comments = await cardModel.getComments(cardId);
  return comments;
};

const getCommentById = async (cardId, commentId, userId) => {
  if (!ObjectId.isValid(cardId)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid cardId!");
  }

  if (!ObjectId.isValid(commentId)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid commentId!");
  }

  await assertCanReadBoardByCardId(cardId, userId);

  const comment = await cardModel.getCommentById(cardId, commentId);
  if (!comment) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Comment not found!");
  }

  return comment;
};

const addAttachment = async (cardId, file, user) => {
  if (!ObjectId.isValid(cardId)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid cardId!");
  }
  await assertBoardMemberByCardId(cardId, user?._id);
  if (!file) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "File is required");
  }

  const sanitizedFilename = sanitizeFilename(file.originalname);
  const s3Key = `${Date.now()}-${sanitizedFilename}`;

  const command = new PutObjectCommand({
    Bucket: process.env.S3_ATTACHMENT_BUCKET,
    Key: s3Key,
    Body: file.buffer,
    ContentType: file.mimetype,
  });

  await s3.send(command);

  const fileUrl = `https://${process.env.S3_ATTACHMENT_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`;
  const attachmentData = {
    fileUrl,
    fileName: file.originalname,
  };
  await cardModel.addAttachment(cardId, attachmentData);

  const isImage = file.mimetype.startsWith("image/");
  if (isImage) {
    await cardModel.update(cardId, { cover: fileUrl });
  }
  return await cardModel.pushActivity(
    cardId,
    createActivity(user, "add_attachment", `added attachment "${file.originalname}"`)
  );
};

const updateAttachment = async (cardId, attachmentId, reqBody, user) => {
  if (!ObjectId.isValid(cardId)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid cardId!");
  }

  if (!ObjectId.isValid(attachmentId)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid attachmentId!");
  }

  await assertBoardMemberByCardId(cardId, user?._id);

  const existingAttachment = await cardModel.getAttachmentById(
    cardId,
    attachmentId
  );
  if (!existingAttachment) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Attachment not found!");
  }

  if (!reqBody.fileName) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "File name is required!");
  }

  const updateData = { fileName: reqBody.fileName };

  let updatedCard = await cardModel.updateAttachment(
    cardId,
    attachmentId,
    updateData
  );
  if (!updatedCard) {
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      "Failed to update attachment!"
    );
  }
  updatedCard = await cardModel.pushActivity(
    cardId,
    createActivity(user, "update_attachment", "renamed an attachment")
  );

  return updatedCard;
};

const deleteAttachment = async (cardId, attachmentId, user) => {
  if (!ObjectId.isValid(cardId)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid cardId!");
  }

  if (!ObjectId.isValid(attachmentId)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid attachmentId!");
  }

  await assertBoardMemberByCardId(cardId, user?._id);

  const existingAttachment = await cardModel.getAttachmentById(
    cardId,
    attachmentId
  );
  if (!existingAttachment) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Attachment not found!");
  }

  let updatedCard = await cardModel.deleteAttachment(cardId, attachmentId);
  if (!updatedCard) {
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      "Failed to delete attachment!"
    );
  }
  updatedCard = await cardModel.pushActivity(
    cardId,
    createActivity(user, "delete_attachment", "deleted an attachment")
  );

  return updatedCard;
};

export const cardService = {
  createNew,
  getDetails,
  update,
  addComment,
  updateComment,
  deleteComment,
  getComments,
  getCommentById,
  addAttachment,
  updateAttachment,
  deleteAttachment,
};
