import express from "express";
import { columnController } from "~/controllers/columnController";
import { columnValidation } from "~/validations/columnValidation";

const Router = express.Router();

Router.route("/")
  .post(columnValidation.createNew, columnController.createNew)

Router.route("/:id")
  .delete(columnController.archiveCard)
  .patch(columnValidation.dragCard, columnController.dragCard)

Router.route("/between-column")
  .put(columnValidation.dragCardBetweenColumn, columnController.dragCardBetweenColumn);
export const columnRoute = Router;