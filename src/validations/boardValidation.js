import { StatusCodes } from "http-status-codes";
import Joi from "joi";
import { BOARD_TYPES } from "~/utils/constants";
import { ApiError } from "~/utils/types";
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from "~/utils/validators";

const createNew = async (req, res, next) => {
  const correctValidation = Joi.object({
    title: Joi.string().required().min(3).max(50).trim().strict(),
    description: Joi.string().required().min(3).max(250).trim().strict(),
    type: Joi.string().valid(BOARD_TYPES.PUBLIC, BOARD_TYPES.PRIVATE).optional(),
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

const inviteMember = async (req, res, next) => {
  const correctCondition = Joi.object({
    email: Joi.string().required().email().min(5).max(100).trim().strict(),
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

const importFromTemplate = async (req, res, next) => {
  const labelSchema = Joi.object({
    _id: Joi.string().required(),
    title: Joi.string().allow("").max(50).default(""),
    color: Joi.string().required().min(1).max(30).trim(),
  });

  const rowSchema = Joi.object({
    columnTitle: Joi.string().required().min(3).max(50).trim().strict(),
    cardTitle: Joi.string().required().min(3).max(50).trim().strict(),
    description: Joi.string().allow("").max(1000).default(""),
    labels: Joi.array().items(labelSchema).default([]),
    dueDate: Joi.string().allow(null, "").default(null),
    completed: Joi.boolean().default(false),
  });

  const correctCondition = Joi.object({
    title: Joi.string().required().min(3).max(50).trim().strict(),
    description: Joi.string().required().min(3).max(250).trim().strict(),
    type: Joi.string().valid(BOARD_TYPES.PUBLIC, BOARD_TYPES.PRIVATE).required(),
    rows: Joi.array().items(rowSchema).required().min(1),
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
  dragColumn,
  inviteMember,
  importFromTemplate,
};
