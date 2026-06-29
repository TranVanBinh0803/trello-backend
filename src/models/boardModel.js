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
  archivedAt: Joi.date().timestamp("javascript").allow(null).default(null),
  archivedBy: Joi.string().allow(null).default(null),
  archiveType: Joi.string().allow(null).default(null),
  previousColumnOrderIds: Joi.array()
    .items(OBJECT_ID_SCHEMA)
    .default([]),
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

const findArchivedByMemberId = async (memberId) => {
  return await getCollection()
    .find({
      memberIds: new ObjectId(memberId),
      _destroy: true,
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
      archivedAt: 1,
      archivedBy: 1,
      archiveType: 1,
    })
    .sort({ archivedAt: -1, updatedAt: -1 })
    .toArray();
};

const getDetails = async (id) => {
  const result = await getCollection()
    .aggregate([
      { $match: { _id: new ObjectId(id), _destroy: false } },
      {
        $lookup: {
          from: columnModel.COLUMN_COLLECTION_NAME,
          let: { boardId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$boardId", "$$boardId"] },
                _destroy: false,
              },
            },
          ],
          as: "columns",
        },
      },
      {
        $lookup: {
          from: cardModel.CARD_COLLECTION_NAME,
          let: { boardId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$boardId", "$$boardId"] },
                _destroy: false,
              },
            },
          ],
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

const restoreColumnOrderIds = async (boardId, previousColumnOrderIds, columnId) => {
  const hasPreviousOrder = previousColumnOrderIds?.length;
  const updateData = hasPreviousOrder
    ? {
        $set: {
          columnOrderIds: previousColumnOrderIds.map((id) => new ObjectId(id)),
          updatedAt: Date.now(),
        },
      }
    : {
        $addToSet: { columnOrderIds: new ObjectId(columnId) },
        $set: { updatedAt: Date.now() },
      };

  return await getCollection().findOneAndUpdate(
    { _id: new ObjectId(boardId), _destroy: false },
    updateData,
    { returnDocument: "after" }
  );
};

const archiveColumn = async (boardId, data, archiveData) => {
  const board = await findOneById(boardId);
  const updatedBoard = await getCollection().findOneAndUpdate(
    { _id: new ObjectId(boardId) },
    {
      $pull: { columnOrderIds: new ObjectId(data.columnId) },
      $set: { updatedAt: Date.now() },
    },
    { returnDocument: "after" }
  );
  await columnModel.archiveOneById(data.columnId, {
    archivedBy: archiveData.archivedBy,
    archiveType: "column",
    previousBoardColumnOrderIds: board?.columnOrderIds || [],
  });
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

const removeMember = async (boardId, userId) => {
  return await getCollection().findOneAndUpdate(
    { _id: new ObjectId(boardId), _destroy: false },
    {
      $pull: { memberIds: new ObjectId(userId) },
      $set: { updatedAt: Date.now() },
    },
    { returnDocument: "after" }
  );
};

const updateType = async (boardId, type, updateData = {}) => {
  return await getCollection().findOneAndUpdate(
    { _id: new ObjectId(boardId), _destroy: false },
    {
      $set: {
        type,
        ...updateData,
        updatedAt: Date.now(),
      },
    },
    { returnDocument: "after" }
  );
};

const archiveBoard = async (boardId, archiveData = {}) => {
  const board = await findOneById(boardId);
  return await getCollection().findOneAndUpdate(
    { _id: new ObjectId(boardId), _destroy: false },
    {
      $set: {
        _destroy: true,
        updatedAt: Date.now(),
        archivedAt: Date.now(),
        archivedBy: archiveData.archivedBy || null,
        archiveType: "board",
        previousColumnOrderIds: board?.columnOrderIds || [],
      },
    },
    { returnDocument: "after" }
  );
};

const restoreBoard = async (boardId) => {
  const board = await findOneById(boardId);
  const columnOrderIds = board?.previousColumnOrderIds?.length
    ? board.previousColumnOrderIds.map((id) => new ObjectId(id))
    : board?.columnOrderIds || [];

  return await getCollection().findOneAndUpdate(
    { _id: new ObjectId(boardId), _destroy: true },
    {
      $set: {
        _destroy: false,
        updatedAt: Date.now(),
        archivedAt: null,
        archivedBy: null,
        archiveType: null,
        previousColumnOrderIds: [],
        columnOrderIds,
      },
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
  findArchivedByMemberId,
  getDetails,
  updateColumnOrderIds,
  dragColumn,
  restoreColumnOrderIds,
  archiveColumn,
  addMember,
  removeMember,
  updateType,
  archiveBoard,
  restoreBoard,
};
