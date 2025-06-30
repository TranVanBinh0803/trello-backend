import express from "express";
import { columnController } from "~/controllers/columnController";
import { verifyToken } from "~/middlewares/authMiddleware";
import { columnValidation } from "~/validations/columnValidation";

const Router = express.Router();

Router.route("/").post(
  columnValidation.createNew,
  verifyToken,
  columnController.createNew
);

Router.route("/:id")
  .delete(verifyToken, columnController.archiveCard)
  .patch(columnValidation.dragCard, verifyToken, columnController.dragCard);

Router.route("/between-column").put(
  columnValidation.dragCardBetweenColumn,
  verifyToken,
  columnController.dragCardBetweenColumn
);
export const columnRoute = Router;
