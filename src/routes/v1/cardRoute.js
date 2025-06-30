import express from "express";
import { cardController } from "~/controllers/cardController";
import { verifyToken } from "~/middlewares/authMiddleware";
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

Router.route("/:cardId/comments")
  .get(verifyToken, cardController.getCommentById)
  .patch(verifyToken, cardController.updateComment)
  .delete(verifyToken, cardController.deleteComment);

export const cardRoute = Router;
