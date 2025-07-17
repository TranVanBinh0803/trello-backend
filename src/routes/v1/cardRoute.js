import express from "express";
import { cardController } from "~/controllers/cardController";
import { verifyToken } from "~/middlewares/authMiddleware";
import upload from "~/utils/configMulter";
import { cardValidation } from "~/validations/cardValidation";

const Router = express.Router();

// Card routes
Router.route("/").post(
  cardValidation.createNew,
  verifyToken,
  cardController.createNew
);
Router.route("/:id").patch(verifyToken, cardController.update);
Router.route("/:id").get(verifyToken, cardController.getDetails);

// Comment routes
Router.route("/:id/comments")
  .get(verifyToken, cardController.getComments)
  .post(verifyToken, cardController.addComment);

Router.route("/:cardId/comments/:commentId")
  .get(verifyToken, cardController.getCommentById)
  .patch(verifyToken, cardController.updateComment)
  .delete(verifyToken, cardController.deleteComment);

Router.route("/:cardId/attachments").post(
  verifyToken,
  upload.single("file"),
  cardController.addAttachment
);
Router.route("/:cardId/attachments/:attachmentId")
  .patch(verifyToken, cardController.updateAttachment)
  .delete(verifyToken, cardController.deleteAttachment);

export const cardRoute = Router;
