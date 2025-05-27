import express from "express";
import { boardController } from "~/controllers/boardController";
import { boardValidation } from "~/validations/boardValidation";

const Router = express.Router();

Router.route("/")
  .post(boardValidation.createNew, boardController.createNew)
  .delete(boardController.archiveColumn);

Router.route("/:id")
  .get(boardController.getDetails)
  .put(boardValidation.dragColumn, boardController.dragColumn);

export const boardRoute = Router;
