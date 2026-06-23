const Joi = require("joi");
import { ObjectId } from "mongodb";
import { GET_DB } from "~/config/mongodb";
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from "~/utils/validators";

const PASSWORD_RESET_OTP_COLLECTION_NAME = "passwordResetOtps";

const PASSWORD_RESET_OTP_COLLECTION_SCHEMA = Joi.object({
  userId: Joi.string()
    .pattern(OBJECT_ID_RULE)
    .message(OBJECT_ID_RULE_MESSAGE)
    .required(),
  email: Joi.string().required().email().min(5).max(100).trim().strict(),
  otp: Joi.string().required().length(6).trim().strict(),
  expiresAt: Joi.date().timestamp("javascript").required(),
  usedAt: Joi.date().timestamp("javascript").default(null),
  createdAt: Joi.date().timestamp("javascript").default(Date.now),
  updatedAt: Joi.date().timestamp("javascript").default(null),
});

const getCollection = () =>
  GET_DB().collection(PASSWORD_RESET_OTP_COLLECTION_NAME);

const validateBeforeCreate = async (data) => {
  return await PASSWORD_RESET_OTP_COLLECTION_SCHEMA.validateAsync(data, {
    abortEarly: false,
  });
};

const createNew = async (data) => {
  const validData = await validateBeforeCreate(data);
  return await getCollection().insertOne({
    ...validData,
    userId: new ObjectId(validData.userId),
  });
};

const invalidatePendingByEmail = async (email) => {
  return await getCollection().updateMany(
    {
      email,
      usedAt: null,
      expiresAt: { $gt: Date.now() },
    },
    {
      $set: {
        usedAt: Date.now(),
        updatedAt: Date.now(),
      },
    }
  );
};

const findValidByEmailAndOtp = async (email, otp) => {
  return await getCollection().findOne({
    email,
    otp,
    usedAt: null,
    expiresAt: { $gt: Date.now() },
  });
};

const markUsed = async (otpId) => {
  return await getCollection().findOneAndUpdate(
    { _id: new ObjectId(otpId) },
    {
      $set: {
        usedAt: Date.now(),
        updatedAt: Date.now(),
      },
    },
    { returnDocument: "after" }
  );
};

export const passwordResetOtpModel = {
  PASSWORD_RESET_OTP_COLLECTION_NAME,
  createNew,
  invalidatePendingByEmail,
  findValidByEmailAndOtp,
  markUsed,
};
