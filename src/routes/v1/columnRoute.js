import express from "express";
import { columnController } from "~/controllers/columnController";
import { asyncHandler } from "~/middlewares/errorHandlingMiddleware";
import { verifyToken } from "~/middlewares/authMiddleware";
import { columnValidation } from "~/validations/columnValidation";

const Router = express.Router();

Router.route("/").post(
  columnValidation.createNew,
  verifyToken,
  asyncHandler(columnController.createNew)
);

Router.route("/:id")
  .delete(verifyToken, asyncHandler(columnController.archiveCard))
  .patch(
    columnValidation.dragCard,
    verifyToken,
    asyncHandler(columnController.dragCard)
  );

Router.route("/between-column").put(
  columnValidation.dragCardBetweenColumn,
  verifyToken,
  asyncHandler(columnController.dragCardBetweenColumn)
);
export const columnRoute = Router;
