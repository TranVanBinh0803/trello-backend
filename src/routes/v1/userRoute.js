import express from "express";
import { userController } from "~/controllers/userController";
import { asyncHandler } from "~/middlewares/errorHandlingMiddleware";
import { verifyToken } from "~/middlewares/authMiddleware";
import { userValidation } from "~/validations/userValidation";
import upload from "~/utils/configMulter";

const Router = express.Router();

Router.route("/me/board-invitations").get(
  verifyToken,
  asyncHandler(userController.getBoardInvitations)
);

Router.route("/me/board-invitations/:invitationId/accept").patch(
  verifyToken,
  asyncHandler(userController.acceptBoardInvitation)
);

Router.route("/me/board-invitations/:invitationId/reject").patch(
  verifyToken,
  asyncHandler(userController.rejectBoardInvitation)
);

Router.route("/me").patch(
  verifyToken,
  upload.single("avatar"),
  userValidation.updateProfile,
  asyncHandler(userController.updateProfile)
);

Router.route("/:id").get(asyncHandler(userController.getUser));

export const userRoute = Router;
