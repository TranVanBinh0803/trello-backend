import express from "express";
import { boardController } from "~/controllers/boardController";
import { asyncHandler } from "~/middlewares/errorHandlingMiddleware";
import { verifyToken } from "~/middlewares/authMiddleware";
import { boardValidation } from "~/validations/boardValidation";
import upload from "~/utils/configMulter";

const Router = express.Router();

Router.route("/").post(
  boardValidation.createNew,
  verifyToken,
  asyncHandler(boardController.createNew)
);

Router.route("/").get(verifyToken, asyncHandler(boardController.getMyBoards));

Router.route("/import-template").get(
  verifyToken,
  asyncHandler(boardController.downloadImportTemplate)
);

Router.route("/import").post(
  verifyToken,
  upload.single("file"),
  asyncHandler(boardController.importFromTemplate)
);

Router.route("/:id/invitations").post(
  boardValidation.inviteMember,
  verifyToken,
  asyncHandler(boardController.inviteMember)
);

Router.route("/:id")
  .get(verifyToken, asyncHandler(boardController.getDetails))
  .patch(
    boardValidation.dragColumn,
    verifyToken,
    asyncHandler(boardController.dragColumn)
  )
  .delete(verifyToken, asyncHandler(boardController.archiveColumn));

export const boardRoute = Router;
