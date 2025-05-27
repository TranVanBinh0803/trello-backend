import Joi from "joi";
import { ObjectId } from "mongodb";
import { GET_DB } from "~/config/mongodb";
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from "~/utils/validators";
import { cardModel } from "./cardModel";

const COLUMN_COLLECTION_NAME = "columns";
const COLUMN_COLLECTION_SCHEMA = Joi.object({
  boardId: Joi.string()
    .required()
    .pattern(OBJECT_ID_RULE)
    .message(OBJECT_ID_RULE_MESSAGE),
  title: Joi.string().required().min(3).max(50).trim().strict(),

  cardOrderIds: Joi.array()
    .items(Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE))
    .default([]),

  createdAt: Joi.date().timestamp("javascript").default(Date.now),
  updatedAt: Joi.date().timestamp("javascript").default(null),
  _destroy: Joi.boolean().default(false),
});

const getCollection = () => GET_DB().collection(COLUMN_COLLECTION_NAME);

const validateBeforeCreate = async (data) => {
  return await COLUMN_COLLECTION_SCHEMA.validateAsync(data, {
    abortEarly: false,
  });
};

const createNew = async (data) => {
  const validData = await validateBeforeCreate(data);
  const newColumn = {
    ...validData,
    boardId: new ObjectId(validData.boardId),
  };
  return await getCollection().insertOne(newColumn);
};

const findOneById = async (id) => {
  return await getCollection().findOne({ _id: new ObjectId(id) });
};

const pullCardOrderIds = async (columnId, cardId) => {
  return await getCollection().findOneAndUpdate(
    { _id: new ObjectId(columnId) },
    {
      $pull: { cardOrderIds: new ObjectId(cardId) },
      $set: { updatedAt: Date.now() },
    },
    { returnDocument: "after" }
  );
};

const updateCardOrderIds = async (columnId, cardOrderIds) => {
  return await getCollection().findOneAndUpdate(
    { _id: new ObjectId(columnId) },
    { $set: { cardOrderIds, updatedAt: Date.now() } },
    { returnDocument: "after" }
  );
};

const dragCardBetweenColumn = async (
  oldColumnId,
  oldCardOrderIds,
  newColumnId,
  newCardOrderIds,
  cardId
) => {
  await updateCardOrderIds(oldColumnId, oldCardOrderIds);
  const updatedNewColumn = await updateCardOrderIds(
    newColumnId,
    newCardOrderIds
  );
  await cardModel.update(cardId, {
    columnId: newColumnId,
  });
  return updatedNewColumn;
};

const archiveCard = async ({ columnId, cardId }) => {
  const updatedColumn = await getCollection().pullCardOrderIds(
    columnId,
    cardId
  );
  await cardModel.deleteOneById(cardId);
  return updatedColumn;
};

const deleteOneById = async (columnId) => {
  const result = await getCollection().deleteOne({
    _id: new ObjectId(columnId),
  });
  // if (result.deletedCount === 0) {
  //   throw new Error(`Column with id ${columnId} not found or already deleted`);
  // }
  return result;
};

export const columnModel = {
  COLUMN_COLLECTION_NAME,
  COLUMN_COLLECTION_SCHEMA,
  createNew,
  findOneById,
  updateCardOrderIds,
  pullCardOrderIds,
  dragCardBetweenColumn,
  archiveCard,
  deleteOneById,
};
