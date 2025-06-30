import express from "express";
import { boardController } from "~/controllers/boardController";
import { verifyToken } from "~/middlewares/authMiddleware";
import { boardValidation } from "~/validations/boardValidation";

const Router = express.Router();

Router.route("/").post(
  boardValidation.createNew,
  verifyToken,
  boardController.createNew
);

Router.route("/:id")
  .get(verifyToken, boardController.getDetails)
  .patch(boardValidation.dragColumn, verifyToken, boardController.dragColumn)
  .delete(verifyToken, boardController.archiveColumn);

export const boardRoute = Router;
