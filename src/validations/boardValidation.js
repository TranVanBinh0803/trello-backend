import { StatusCodes } from "http-status-codes";
import Joi from "joi";
import { BOARD_TYPES } from "~/utils/constants";
import { ApiError } from "~/utils/types";
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from "~/utils/validators";

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

const dragColumn = async (req, res, next) => {
  const correctCondition = Joi.object({
    columnOrderIds: Joi.array()
      .items(Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE))
      .required()
      .min(1)
      .messages({
        'array.min': 'columnOrderIds must contain at least one column ID',
        'any.required': 'columnOrderIds is required'
      })
  });

  try {
    await correctCondition.validateAsync(req.body, {
      abortEarly: false,
    });
    next();
  } catch (error) {
    const errorMessage = new Error(error).message;
    const customError = new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, errorMessage);
    next(customError);
  }
};

export const boardValidation = {
  createNew,
  dragColumn
};
