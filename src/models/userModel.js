const Joi = require("joi");
import { ObjectId } from "mongodb";
import { GET_DB } from "~/config/mongodb";

const USER_COLLECTION_NAME = "users";

const USER_COLLECTION_SCHEMA = Joi.object({
  username: Joi.string().required().min(3).max(50).trim().strict(),
  email: Joi.string().required().email().min(5).max(100).trim().strict(),
  password: Joi.string().required().min(6).trim().strict(),
  avatar: Joi.string().uri().trim().strict().default(null),

  createdAt: Joi.date().timestamp("javascript").default(Date.now),
  updatedAt: Joi.date().timestamp("javascript").default(null),
  _destroy: Joi.boolean().default(false),
});

const getCollection = () => GET_DB().collection(USER_COLLECTION_NAME);

const validateBeforeCreate = async (data) => {
  return await USER_COLLECTION_SCHEMA.validateAsync(data, {
    abortEarly: false,
  });
};

const createNew = async (data) => {
  const validData = await validateBeforeCreate(data);
  return await getCollection().insertOne(validData);
};

const findOneById = async (id) => {
  return await getCollection().findOne({ _id: new ObjectId(id) });
};

const findOneByEmail = async (email) => {
  return await getCollection().findOne({ email });
};

const updateProfile = async (userId, updateData) => {
  return await getCollection().findOneAndUpdate(
    { _id: new ObjectId(userId) },
    {
      $set:{ ...updateData, updatedAt: Date.now() },
    },
    { returnDocument: "after" }
  );
};

export const userModel = {
  USER_COLLECTION_NAME,
  USER_COLLECTION_SCHEMA,
  createNew,
  findOneById,
  findOneByEmail,
  updateProfile,
};
