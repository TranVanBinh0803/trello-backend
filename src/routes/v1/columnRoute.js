import express from "express";
import { columnController } from "~/controllers/columnController";
import { columnValidation } from "~/validations/columnValidation";

const Router = express.Router();

Router.route("/")
  .post(columnValidation.createNew, columnController.createNew)
  .put(columnValidation.dragCard, columnController.dragCard)
  .delete(columnController.archiveCard);

Router.route("/:id")
  // .delete(columnController.archiveCard);

  
Router.route("/between-column")
  .put(columnValidation.dragCardBetweenColumn, columnController.dragCardBetweenColumn);
export const columnRoute = Router;