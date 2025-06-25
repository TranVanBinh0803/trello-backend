/* eslint-disable no-useless-catch */
import { ObjectId } from "mongodb";
import { userModel } from "~/models/userModel";
import bcryptjs from "bcryptjs";
import { ApiError } from "~/utils/types";
import { StatusCodes } from "http-status-codes";

const createNew = async (reqBody) => {
  try {
    const { email, password } = reqBody;
    const existingUser = await userModel.findOneByEmail(email);
    if (existingUser) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "Email is already registered"
      );
    }
    const hashedPassword = bcryptjs.hashSync(
      password,
      bcryptjs.genSaltSync(10)
    );
    const userData = {
      ...reqBody,
      password: hashedPassword,
    };
    const createdResult = await userModel.createNew(userData);
    const newUser = await userModel.findOneById(
      new ObjectId(createdResult.insertedId)
    );

    return newUser;
  } catch (error) {
    throw error;
  }
};

export const userService = {
  createNew,
};
