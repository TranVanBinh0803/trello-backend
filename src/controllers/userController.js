import { StatusCodes } from "http-status-codes";
import { userService } from "~/services/userService";
import { ApiResponse } from "~/utils/types";

const updateProfile = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const updateData = req.body;
    const updatedUser = await userService.updateProfile(userId, updateData);
    res
      .status(StatusCodes.OK)
      .json(
        new ApiResponse(
          StatusCodes.OK,
          "Update profile successfully",
          updatedUser
        )
      );
  } catch (error) {
    next(error);
  }
};

const getUser = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const user = await userService.getUser(userId);
    res
      .status(StatusCodes.OK)
      .json(new ApiResponse(StatusCodes.OK, "Get user successfully", user));
  } catch (error) {
    next(error);
  }
};

export const userController = {
  updateProfile,
  getUser,
};
