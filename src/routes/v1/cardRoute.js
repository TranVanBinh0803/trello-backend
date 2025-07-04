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

// Comment routes
Router.route("/:id/comments")
  .get(verifyToken, cardController.getComments)
  .post(verifyToken, cardController.addComment);

Router.route("/:cardId/comments/:commentId")
  .get(verifyToken, cardController.getCommentById)
  .patch(verifyToken, cardController.updateComment)
  .delete(verifyToken, cardController.deleteComment);


Router.route("/:cardId/uploadFile").post(
  verifyToken,
  upload.single("file"),
  cardController.uploadFile
);

export const cardRoute = Router;
