import { StatusCodes } from "http-status-codes";
import { cardService } from "~/services/cardService";
import { ApiResponse } from "~/utils/types";

const createNew = async (req, res) => {
  const createCard = await cardService.createNew(req.body, req.user);
  res
    .status(StatusCodes.CREATED)
    .json(
      new ApiResponse(StatusCodes.CREATED, "Create new card successfully", createCard)
    );
};

const getDetails = async (req, res) => {
  const cardId = req.params.id;
  const card = await cardService.getDetails(cardId);
  res
    .status(StatusCodes.OK)
    .json(new ApiResponse(StatusCodes.OK, "Get detail card successfully", card));
};

const update = async (req, res) => {
  const cardId = req.params.id;
  const reqBody = req.body;

  const updatedCard = await cardService.update(cardId, reqBody, req.user);
  res
    .status(StatusCodes.OK)
    .json(new ApiResponse(StatusCodes.OK, "Card updated successfully", updatedCard));
};

const addComment = async (req, res) => {
  const cardId = req.params.id;
  const reqBody = req.body;

  const updatedCard = await cardService.addComment(cardId, reqBody, req.user);
  res
    .status(StatusCodes.CREATED)
    .json(
      new ApiResponse(StatusCodes.CREATED, "Comment added successfully", updatedCard)
    );
};

const updateComment = async (req, res) => {
  const cardId = req.params.cardId;
  const commentId = req.params.commentId;
  const reqBody = req.body;

  const updatedCard = await cardService.updateComment(
    cardId,
    commentId,
    reqBody,
    req.user
  );
  res
    .status(StatusCodes.OK)
    .json(
      new ApiResponse(StatusCodes.OK, "Comment updated successfully", updatedCard)
    );
};

const deleteComment = async (req, res) => {
  const cardId = req.params.cardId;
  const commentId = req.params.commentId;

  const updatedCard = await cardService.deleteComment(
    cardId,
    commentId,
    req.user
  );
  res
    .status(StatusCodes.OK)
    .json(
      new ApiResponse(StatusCodes.OK, "Comment deleted successfully", updatedCard)
    );
};

const getComments = async (req, res) => {
  const cardId = req.params.id;

  const comments = await cardService.getComments(cardId);
  res
    .status(StatusCodes.OK)
    .json(new ApiResponse(StatusCodes.OK, "Get comments successfully", comments));
};

const getCommentById = async (req, res) => {
  const cardId = req.params.cardId;
  const commentId = req.params.commentId;

  const comment = await cardService.getCommentById(cardId, commentId);
  res
    .status(StatusCodes.OK)
    .json(new ApiResponse(StatusCodes.OK, "Get comment successfully", comment));
};

const addAttachment = async (req, res) => {
  const cardId = req.params.cardId;
  const file = req.file;
  const result = await cardService.addAttachment(cardId, file, req.user);
  res
    .status(StatusCodes.OK)
    .json(new ApiResponse(StatusCodes.OK, "Add attachment successfully", result));
};

const updateAttachment = async (req, res) => {
  const cardId = req.params.cardId;
  const attachmentId = req.params.attachmentId;
  const reqBody = req.body;

  const updatedCard = await cardService.updateAttachment(
    cardId,
    attachmentId,
    reqBody,
    req.user
  );
  res
    .status(StatusCodes.OK)
    .json(
      new ApiResponse(StatusCodes.OK, "Attachment updated successfully", updatedCard)
    );
};

const deleteAttachment = async (req, res) => {
  const cardId = req.params.cardId;
  const attachmentId = req.params.attachmentId;

  const updatedCard = await cardService.deleteAttachment(
    cardId,
    attachmentId,
    req.user
  );
  res
    .status(StatusCodes.OK)
    .json(
      new ApiResponse(StatusCodes.OK, "Attachment deleted successfully", updatedCard)
    );
};

export const cardController = {
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
