import express from "express";
import { boardController } from "~/controllers/boardController";
import { asyncHandler } from "~/middlewares/errorHandlingMiddleware";
import { optionalVerifyToken, verifyToken } from "~/middlewares/authMiddleware";
import { boardValidation } from "~/validations/boardValidation";
import upload from "~/utils/configMulter";

const Router = express.Router();

Router.route("/").post(
  boardValidation.createNew,
  verifyToken,
  asyncHandler(boardController.createNew)
);

Router.route("/").get(verifyToken, asyncHandler(boardController.getMyBoards));

Router.route("/archived").get(
  verifyToken,
  asyncHandler(boardController.getArchivedBoards)
);

Router.route("/vnpay-return").get(
  asyncHandler(boardController.handleVnpayPrivateUpgradeReturn)
);

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

Router.route("/:id/members/me").delete(
  verifyToken,
  asyncHandler(boardController.leaveBoard)
);

Router.route("/:id/archive").delete(
  verifyToken,
  asyncHandler(boardController.archiveBoard)
);

Router.route("/:id/private-upgrade-payment").post(
  verifyToken,
  asyncHandler(boardController.createPrivateUpgradePayment)
);

Router.route("/:id/restore").patch(
  verifyToken,
  asyncHandler(boardController.restoreBoard)
);

Router.route("/:id/archived-items").get(
  verifyToken,
  asyncHandler(boardController.getArchivedItems)
);

Router.route("/:id/columns/:columnId/restore").patch(
  verifyToken,
  asyncHandler(boardController.restoreColumn)
);

Router.route("/:id")
  .get(optionalVerifyToken, asyncHandler(boardController.getDetails))
  .patch(
    boardValidation.dragColumn,
    verifyToken,
    asyncHandler(boardController.dragColumn)
  )
  .delete(verifyToken, asyncHandler(boardController.archiveColumn));

export const boardRoute = Router;
