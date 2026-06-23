import express from "express";
import { cardController } from "~/controllers/cardController";
import { asyncHandler } from "~/middlewares/errorHandlingMiddleware";
import { verifyToken } from "~/middlewares/authMiddleware";
import upload from "~/utils/configMulter";
import { cardValidation } from "~/validations/cardValidation";

const Router = express.Router();

// Card routes
Router.route("/").post(
  cardValidation.createNew,
  verifyToken,
  asyncHandler(cardController.createNew)
);
Router.route("/:id").patch(verifyToken, asyncHandler(cardController.update));
Router.route("/:id").get(verifyToken, asyncHandler(cardController.getDetails));

// Comment routes
Router.route("/:id/comments")
  .get(verifyToken, asyncHandler(cardController.getComments))
  .post(verifyToken, asyncHandler(cardController.addComment));

Router.route("/:cardId/comments/:commentId")
  .get(verifyToken, asyncHandler(cardController.getCommentById))
  .patch(verifyToken, asyncHandler(cardController.updateComment))
  .delete(verifyToken, asyncHandler(cardController.deleteComment));

Router.route("/:cardId/attachments").post(
  verifyToken,
  upload.single("file"),
  asyncHandler(cardController.addAttachment)
);
Router.route("/:cardId/attachments/:attachmentId")
  .patch(verifyToken, asyncHandler(cardController.updateAttachment))
  .delete(verifyToken, asyncHandler(cardController.deleteAttachment));

export const cardRoute = Router;
