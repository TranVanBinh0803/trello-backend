import express from "express";
import { authController } from "~/controllers/authController";
import { asyncHandler } from "~/middlewares/errorHandlingMiddleware";
import { authValidation } from "~/validations/authValidation";

const Router = express.Router();

Router.route("/login").post(authValidation.login, asyncHandler(authController.login));
Router.route("/register").post(
  authValidation.register,
  asyncHandler(authController.register)
);
Router.route("/logout").get(asyncHandler(authController.logout));
Router.route("/forgot-password").post(
  authValidation.forgotPassword,
  asyncHandler(authController.forgotPassword)
);
Router.route("/reset-password").post(
  authValidation.resetPassword,
  asyncHandler(authController.resetPassword)
);

export const authRoute = Router;
