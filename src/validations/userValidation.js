import { StatusCodes } from "http-status-codes";
import Joi from "joi";
import { ApiError } from "~/utils/types";

const updateProfile = async (req, res, next) => {
  const correctValidation = Joi.object({
    username: Joi.string().required().min(3).max(50).trim().strict(),
  });
  try {
    await correctValidation.validateAsync(req.body, { abortEarly: false });
    next();
  } catch (error) {
    next(
      new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, new Error(error).message)
    );
  }
};

export const userValidation = {
  updateProfile,
};
