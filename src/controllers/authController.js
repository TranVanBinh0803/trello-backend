import { StatusCodes } from "http-status-codes";
import { authService } from "~/services/authService";
import { userService } from "~/services/userService";
import { ApiResponse } from "~/utils/types";

const login = async (req, res, next) => {
  try {
    const token = await authService.login(req.body)
    res.status(StatusCodes.CREATED).json(new ApiResponse(StatusCodes.OK, "Create new card successfully", token));
  } catch (error) {
    next(error);
  }
};

const register = async (req, res, next) => {
  try {
    const createUser = await userService.createNew(req.body)
    res.status(StatusCodes.CREATED).json(new ApiResponse(StatusCodes.OK, "Create new user successfully", createUser));
  } catch (error) {
    next(error);
  }
};

export const authController = {
  login,
  register
};
