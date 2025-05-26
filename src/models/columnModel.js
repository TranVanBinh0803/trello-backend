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

const createNew = async (data) => {
  try {
    const validData = await validateBeforeCreate(data);
    const resColumn = {
      ...validData,
      boardId: new ObjectId(validData.boardId),
    };
    return await GET_DB()
      .collection(COLUMN_COLLECTION_NAME)
      .insertOne(resColumn);
  } catch (error) {
    throw new Error(error);
  }
};

const findOneById = async (id) => {
  try {
    return await GET_DB()
      .collection(COLUMN_COLLECTION_NAME)
      .findOne({ _id: id });
  } catch (error) {
    throw new Error(error);
  }
};

const updateCardOrderIds = async (columnId, cardId) => {
  try {
    return await GET_DB()
      .collection(COLUMN_COLLECTION_NAME)
      .findOneAndUpdate(
        { _id: new ObjectId(columnId) },
        { $push: { cardOrderIds: new ObjectId(cardId) } },
        { returnDocument: "after" }
      );
  } catch (error) {
    throw new Error(error);
  }
};

const dragCard = async (columnId, newCardOrderIds) => {
  try {
    return await GET_DB()
      .collection(COLUMN_COLLECTION_NAME)
      .findOneAndUpdate(
        { _id: new ObjectId(columnId) },
        { $set: { cardOrderIds: newCardOrderIds } },
        { returnDocument: "after" }
      );
  } catch (error) {
    throw new Error(error);
  }
};

const dragCardBetweenColumn = async (
  oldColumnId,
  oldCardOrderIds,
  newColumnId,
  newCardOrderIds,
  cardId,
) => {
  try {
    const db = GET_DB();
    const collection = db.collection(COLUMN_COLLECTION_NAME);

    // Update old column
    await collection.findOneAndUpdate(
      { _id: new ObjectId(oldColumnId) },
      { $set: { cardOrderIds: oldCardOrderIds } },
      { returnDocument: "after" }
    );

    // Update new column and return it
    const updatedNewColumn = await collection.findOneAndUpdate(
      { _id: new ObjectId(newColumnId) },
      { $set: { cardOrderIds: newCardOrderIds } },
      { returnDocument: "after" }
    );

    // Update card
    await cardModel.update(cardId, {
      columnId: newColumnId,
    });
    return updatedNewColumn;
  } catch (error) {
    throw new Error(error);
  }
};

const validateBeforeCreate = async (data) => {
  return await COLUMN_COLLECTION_SCHEMA.validateAsync(data, {
    abortEarly: false,
  });
};

export const columnModel = {
  COLUMN_COLLECTION_NAME,
  COLUMN_COLLECTION_SCHEMA,
  createNew,
  findOneById,
  updateCardOrderIds,
  dragCard,
  dragCardBetweenColumn,
};
