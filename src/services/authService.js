/* eslint-disable no-useless-catch */
import { StatusCodes } from "http-status-codes";
import { userModel } from "~/models/userModel";
import { ApiError } from "~/utils/types";
import bcryptjs from "bcryptjs";
import { generateToken } from "~/utils/genereToken";

const login = async (reqBody) => {
  try {
    const { email, password } = reqBody;
    const user = await userModel.findOneByEmail(email);
    if (!user) {
      throw new ApiError(StatusCodes.NOT_FOUND, "User not found!");
    }
    const isPasswordValid = bcryptjs.compareSync(password, user.password);
    if (!isPasswordValid) {
      throw new ApiError(StatusCodes.FORBIDDEN, "Invalid credentials");
    }
    const token = generateToken(user._id);
    return token;
  } catch (error) {
    throw error;
  }
};

export const authService = {
  login,
};
