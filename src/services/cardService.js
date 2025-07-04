/* eslint-disable no-useless-catch */
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { StatusCodes } from "http-status-codes";
import { ObjectId } from "mongodb";
import { cardModel } from "~/models/cardModel";
import { columnModel } from "~/models/columnModel";
import { s3 } from "~/utils/configAWS";
import { sanitizeFilename } from "~/utils/helpers";
import { ApiError } from "~/utils/types";

const createNew = async (reqBody) => {
  try {
    const createdCard = await cardModel.createNew(reqBody);
    const newCardId = createdCard.insertedId;

    const getNewCard = await cardModel.findOneById(new ObjectId(newCardId));

    await columnModel.pushCardOrderIds(
      getNewCard.columnId.toString(),
      newCardId
    );
    return getNewCard;
  } catch (error) {
    throw error;
  }
};

const update = async (cardId, reqBody) => {
  try {
    if (!ObjectId.isValid(cardId)) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid cardId!");
    }
    const card = await cardModel.findOneById(cardId);
    if (!card) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Card not found!");
    }
    const updatedCard = await cardModel.update(cardId, reqBody);

    if (!updatedCard) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Card update failed!");
    }

    return updatedCard;
  } catch (error) {
    throw error;
  }
};

const addComment = async (cardId, reqBody) => {
  try {
    if (!ObjectId.isValid(cardId)) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid cardId!");
    }

    const card = await cardModel.findOneById(cardId);
    if (!card) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Card not found!");
    }

    if (!reqBody.authorName || !reqBody.content) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "Author name and content are required!"
      );
    }

    const updatedCard = await cardModel.addComment(cardId, reqBody);
    if (!updatedCard) {
      throw new ApiError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        "Failed to add comment!"
      );
    }

    return updatedCard;
  } catch (error) {
    throw error;
  }
};

const updateComment = async (cardId, commentId, reqBody) => {
  try {
    if (!ObjectId.isValid(cardId)) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid cardId!");
    }

    if (!ObjectId.isValid(commentId)) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid commentId!");
    }

    const card = await cardModel.findOneById(cardId);
    if (!card) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Card not found!");
    }

    const existingComment = await cardModel.getCommentById(cardId, commentId);
    if (!existingComment) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Comment not found!");
    }

    if (!reqBody.content) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Content is required!");
    }

    const updateData = { content: reqBody.content };

    const updatedCard = await cardModel.updateComment(
      cardId,
      commentId,
      updateData
    );
    if (!updatedCard) {
      throw new ApiError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        "Failed to update comment!"
      );
    }

    return updatedCard;
  } catch (error) {
    throw error;
  }
};

const deleteComment = async (cardId, commentId) => {
  try {
    if (!ObjectId.isValid(cardId)) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid cardId!");
    }

    if (!ObjectId.isValid(commentId)) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid commentId!");
    }

    const card = await cardModel.findOneById(cardId);
    if (!card) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Card not found!");
    }

    const existingComment = await cardModel.getCommentById(cardId, commentId);
    if (!existingComment) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Comment not found!");
    }

    const updatedCard = await cardModel.deleteComment(cardId, commentId);
    if (!updatedCard) {
      throw new ApiError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        "Failed to delete comment!"
      );
    }

    return updatedCard;
  } catch (error) {
    throw error;
  }
};

const getComments = async (cardId) => {
  try {
    if (!ObjectId.isValid(cardId)) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid cardId!");
    }

    const card = await cardModel.findOneById(cardId);
    if (!card) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Card not found!");
    }

    const comments = await cardModel.getComments(cardId);
    return comments;
  } catch (error) {
    throw error;
  }
};

const getCommentById = async (cardId, commentId) => {
  try {
    if (!ObjectId.isValid(cardId)) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid cardId!");
    }

    if (!ObjectId.isValid(commentId)) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid commentId!");
    }

    const card = await cardModel.findOneById(cardId);
    if (!card) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Card not found!");
    }

    const comment = await cardModel.getCommentById(cardId, commentId);
    if (!comment) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Comment not found!");
    }

    return comment;
  } catch (error) {
    throw error;
  }
};

const uploadFile = async (cardId, file) => {
  if (!ObjectId.isValid(cardId)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid cardId!");
  }
  if (!file) throw new Error("File is required");

  // Generate a safe filename
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
    fileUrl: fileUrl,
    fileName: file.originalname,
  };
  const result = await cardModel.addAttachment(cardId, attachmentData);

  const isImage = file.mimetype.startsWith("image/");
  if (isImage) {
    await cardModel.update(cardId, { cover: fileUrl });
  }
  return result;
};

export const cardService = {
  createNew,
  update,
  addComment,
  updateComment,
  deleteComment,
  getComments,
  getCommentById,
  uploadFile,
};
