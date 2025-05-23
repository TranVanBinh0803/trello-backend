import { StatusCodes } from "http-status-codes";
import Joi from "joi";
import { BOARD_TYPES } from "~/utils/constants";
import { ApiError } from "~/utils/types";

const createNew = async (req, res, next) => {
  const correctValidation = Joi.object({
    title: Joi.string().required().min(3).max(50).trim().strict(),
    description: Joi.string().required().min(3).max(250).trim().strict(),
    type: Joi.string().valid(BOARD_TYPES.PUBLIC,BOARD_TYPES.PRIVATE).required()
  });
  try {
    await correctValidation.validateAsync(req.body, { abortEarly: false });
    next();
  } catch (error) {
    next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, new Error(error).message))
  }
};

export const boardValidation = {
  createNew,
};
