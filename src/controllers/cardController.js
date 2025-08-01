import { StatusCodes } from "http-status-codes";
import { cardService } from "~/services/cardService";
import { ApiResponse } from "~/utils/types";

const createNew = async (req, res, next) => {
  try {
    const createCard = await cardService.createNew(req.body);
    res
      .status(StatusCodes.CREATED)
      .json(
        new ApiResponse(
          StatusCodes.CREATED,
          "Create new card successfully",
          createCard
        )
      );
  } catch (error) {
    next(error);
  }
};

const getDetails = async (req, res, next) => {
  try {
    const cardId = req.params.id;
    const card = await cardService.getDetails(cardId);
    res
      .status(StatusCodes.OK)
      .json(new ApiResponse(StatusCodes.OK, "Get detail card successfully", card));
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const cardId = req.params.id;
    const reqBody = req.body;

    const updatedCard = await cardService.update(cardId, reqBody);
    res
      .status(StatusCodes.OK)
      .json(
        new ApiResponse(
          StatusCodes.OK,
          "Card updated successfully",
          updatedCard
        )
      );
  } catch (error) {
    next(error);
  }
};

const addComment = async (req, res, next) => {
  try {
    const cardId = req.params.id;
    const reqBody = req.body;

    const updatedCard = await cardService.addComment(cardId, reqBody);
    res
      .status(StatusCodes.CREATED)
      .json(
        new ApiResponse(
          StatusCodes.CREATED,
          "Comment added successfully",
          updatedCard
        )
      );
  } catch (error) {
    next(error);
  }
};

const updateComment = async (req, res, next) => {
  try {
    const cardId = req.params.cardId;
    const commentId = req.params.commentId;

    const reqBody = req.body;

    const updatedCard = await cardService.updateComment(
      cardId,
      commentId,
      reqBody
    );
    res
      .status(StatusCodes.OK)
      .json(
        new ApiResponse(
          StatusCodes.OK,
          "Comment updated successfully",
          updatedCard
        )
      );
  } catch (error) {
    next(error);
  }
};

const deleteComment = async (req, res, next) => {
  try {
    const cardId = req.params.cardId;
    const commentId = req.params.commentId;

    const updatedCard = await cardService.deleteComment(cardId, commentId);
    res
      .status(StatusCodes.OK)
      .json(
        new ApiResponse(
          StatusCodes.OK,
          "Comment deleted successfully",
          updatedCard
        )
      );
  } catch (error) {
    next(error);
  }
};

const getComments = async (req, res, next) => {
  try {
    const cardId = req.params.id;

    const comments = await cardService.getComments(cardId);
    res
      .status(StatusCodes.OK)
      .json(
        new ApiResponse(StatusCodes.OK, "Get comments successfully", comments)
      );
  } catch (error) {
    next(error);
  }
};

const getCommentById = async (req, res, next) => {
  try {
    const cardId = req.params.cardId;
    const commentId = req.params.commentId;

    const comment = await cardService.getCommentById(cardId, commentId);
    res
      .status(StatusCodes.OK)
      .json(
        new ApiResponse(StatusCodes.OK, "Get comment successfully", comment)
      );
  } catch (error) {
    next(error);
  }
};

const addAttachment = async (req, res, next) => {
  try {
    const cardId = req.params.cardId;
    const file = req.file;
    const result = await cardService.addAttachment(cardId, file);
    res
      .status(StatusCodes.OK)
      .json(
        new ApiResponse(StatusCodes.OK, "Add attachment successfully", result)
      );
  } catch (error) {
    next(error);
  }
};

const updateAttachment = async (req, res, next) => {
  try {
    const cardId = req.params.cardId;
    const attachmentId = req.params.attachmentId;
    const reqBody = req.body;

    const updatedCard = await cardService.updateAttachment(
      cardId,
      attachmentId,
      reqBody
    );
    res
      .status(StatusCodes.OK)
      .json(
        new ApiResponse(
          StatusCodes.OK,
          "Attachment updated successfully",
          updatedCard
        )
      );
  } catch (error) {
    next(error);
  }
};

const deleteAttachment = async (req, res, next) => {
  try {
    const cardId = req.params.cardId;
    const attachmentId = req.params.attachmentId;

    const updatedCard = await cardService.deleteAttachment(cardId, attachmentId);
    res
      .status(StatusCodes.OK)
      .json(
        new ApiResponse(
          StatusCodes.OK,
          "Attachment deleted successfully",
          updatedCard
        )
      );
  } catch (error) {
    next(error);
  }
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
  deleteAttachment
};
