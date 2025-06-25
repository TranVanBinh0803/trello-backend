import { StatusCodes } from "http-status-codes";
import Joi from "joi";
import { ApiError } from "~/utils/types";

const login = async (req, res, next) => {
  const correctValidation = Joi.object({
    email: Joi.string().required().email().min(5).max(100).trim().strict(),
    password: Joi.string().required().min(6).trim().strict(),
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

const register = async (req, res, next) => {
  const correctValidation = Joi.object({
    username: Joi.string().required().min(3).max(50).trim().strict(),
    email: Joi.string().required().email().min(5).max(100).trim().strict(),
    password: Joi.string().required().min(6).trim().strict(),
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

export const authValidation = {
  login,
  register,
};
