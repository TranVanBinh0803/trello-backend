import { StatusCodes } from "http-status-codes";
import { authService } from "~/services/authService";
import { userService } from "~/services/userService";
import { ApiResponse } from "~/utils/types";

const login = async (req, res) => {
  const loginResponse = await authService.login(req.body);
  res
    .status(StatusCodes.OK)
    .json(new ApiResponse(StatusCodes.OK, "Login successfully", loginResponse));
};

const register = async (req, res) => {
  const createdUser = await userService.createNew(req.body);
  res
    .status(StatusCodes.CREATED)
    .json(
      new ApiResponse(
        StatusCodes.CREATED,
        "Create new user successfully",
        createdUser
      )
    );
};

const logout = async (req, res) => {
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, "Logout successfully"));
};

const forgotPassword = async (req, res) => {
  const resetData = await authService.forgotPassword(req.body);
  res
    .status(StatusCodes.OK)
    .json(
      new ApiResponse(StatusCodes.OK, "Reset password token created", resetData)
    );
};

const resetPassword = async (req, res) => {
  const resetData = await authService.resetPassword(req.body);
  res
    .status(StatusCodes.OK)
    .json(
      new ApiResponse(StatusCodes.OK, "Password reset successfully", resetData)
    );
};

export const authController = {
  login,
  register,
  logout,
  forgotPassword,
  resetPassword,
};
