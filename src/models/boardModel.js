const Joi = require("joi");
import { ObjectId } from "mongodb";
import { GET_DB } from "~/config/mongodb";
import { BOARD_TYPES } from "~/utils/constants";
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from "~/utils/validators";
import { columnModel } from "./columnModel";
import { cardModel } from "./cardModel";
import { userModel } from "./userModel";

const BOARD_COLLECTION_NAME = "boards";
const OBJECT_ID_SCHEMA = Joi.alternatives().try(
  Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE),
  Joi.object()
);

const BOARD_COLLECTION_SCHEMA = Joi.object({
  title: Joi.string().required().min(3).max(50).trim().strict(),
  description: Joi.string().required().min(3).max(250).trim().strict(),
  type: Joi.string().valid(BOARD_TYPES.PUBLIC, BOARD_TYPES.PRIVATE).required(),
  slug: Joi.string().required().min(3).trim().strict(),
  columnOrderIds: Joi.array()
    .items(Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE))
    .default([]),
  ownerIds: Joi.array()
    .items(OBJECT_ID_SCHEMA)
    .default([]),
  memberIds: Joi.array()
    .items(OBJECT_ID_SCHEMA)
    .default([]),
  createdAt: Joi.date().timestamp("javascript").default(Date.now),
  updatedAt: Joi.date().timestamp("javascript").default(null),
  _destroy: Joi.boolean().default(false),
});

const getCollection = () => GET_DB().collection(BOARD_COLLECTION_NAME);

const validateBeforeCreate = async (data) => {
  return await BOARD_COLLECTION_SCHEMA.validateAsync(data, {
    abortEarly: false,
  });
};

const createNew = async (data) => {
  const validData = await validateBeforeCreate(data);
  return getCollection().insertOne(validData);
};

const findOneById = async (id) => {
  return await getCollection().findOne({ _id: new ObjectId(id) });
};

const findByMemberId = async (memberId) => {
  return await getCollection()
    .find({
      memberIds: new ObjectId(memberId),
      _destroy: false,
    })
    .project({
      title: 1,
      description: 1,
      type: 1,
      ownerIds: 1,
      memberIds: 1,
      columnOrderIds: 1,
      createdAt: 1,
      updatedAt: 1,
    })
    .sort({ updatedAt: -1, createdAt: -1 })
    .toArray();
};

const getDetails = async (id) => {
  const result = await getCollection()
    .aggregate([
      { $match: { _id: new ObjectId(id), _destroy: false } },
      {
        $lookup: {
          from: columnModel.COLUMN_COLLECTION_NAME,
          localField: "_id",
          foreignField: "boardId",
          as: "columns",
        },
      },
      {
        $lookup: {
          from: cardModel.CARD_COLLECTION_NAME,
          localField: "_id",
          foreignField: "boardId",
          as: "cards",
        },
      },
      {
        $lookup: {
          from: userModel.USER_COLLECTION_NAME,
          localField: "memberIds",
          foreignField: "_id",
          as: "members",
        },
      },
      {
        $project: {
          "members.password": 0,
        },
      },
    ])
    .toArray();
  return result[0] || null;
};

const updateColumnOrderIds = async (boardId, columnId) => {
  return await getCollection().findOneAndUpdate(
    { _id: new ObjectId(boardId) },
    {
      $push: { columnOrderIds: new ObjectId(columnId) },
      $set: { updatedAt: Date.now() },
    },
    { returnDocument: "after" }
  );
};

const dragColumn = async (boardId, newColumnOrderIds) => {
  return await getCollection().findOneAndUpdate(
    { _id: new ObjectId(boardId) },
    { $set: { columnOrderIds: newColumnOrderIds, updatedAt: Date.now() } },
    { returnDocument: "after" }
  );
};

const archiveColumn = async (boardId, data) => {
  const updatedBoard = await getCollection().findOneAndUpdate(
    { _id: new ObjectId(boardId) },
    {
      $pull: { columnOrderIds: new ObjectId(data.columnId) },
      $set: { updatedAt: Date.now() },
    },
    { returnDocument: "after" }
  );
  await columnModel.deleteOneById(data.columnId);
  await cardModel.removeCardsByColumnId(data.columnId);
  return updatedBoard;
};

const addMember = async (boardId, userId) => {
  return await getCollection().findOneAndUpdate(
    { _id: new ObjectId(boardId), _destroy: false },
    {
      $addToSet: { memberIds: new ObjectId(userId) },
      $set: { updatedAt: Date.now() },
    },
    { returnDocument: "after" }
  );
};

export const boardModel = {
  BOARD_COLLECTION_NAME,
  BOARD_COLLECTION_SCHEMA,
  createNew,
  findOneById,
  findByMemberId,
  getDetails,
  updateColumnOrderIds,
  dragColumn,
  archiveColumn,
  addMember,
};
