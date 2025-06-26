import { StatusCodes } from "http-status-codes";
import { authService } from "~/services/authService";
import { userService } from "~/services/userService";
import { ApiResponse } from "~/utils/types";

const login = async (req, res, next) => {
  try {
    const loginResponse = await authService.login(req.body);
    res
      .status(StatusCodes.OK)
      .json(
        new ApiResponse(StatusCodes.OK, "Login successfully", loginResponse)
      );
  } catch (error) {
    next(error);
  }
};

const register = async (req, res, next) => {
  try {
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
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    // const userId = req.params.id;
    // const logoutResponse = await authService.logout(userId);
    res
      .status(StatusCodes.OK)
      .json(new ApiResponse(StatusCodes.OK, "Logout successfully"));
  } catch (error) {
    next(error);
  }
};

export const authController = {
  login,
  register,
  logout,
};
