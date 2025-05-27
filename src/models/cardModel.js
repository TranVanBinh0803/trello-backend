import Joi from "joi";
import { ObjectId } from "mongodb";
import { GET_DB } from "~/config/mongodb";
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from "~/utils/validators";

const CARD_COLLECTION_NAME = "cards";
const CARD_COLLECTION_SCHEMA = Joi.object({
  boardId: Joi.string()
    .required()
    .pattern(OBJECT_ID_RULE)
    .message(OBJECT_ID_RULE_MESSAGE),
  columnId: Joi.string()
    .required()
    .pattern(OBJECT_ID_RULE)
    .message(OBJECT_ID_RULE_MESSAGE),

  title: Joi.string().required().min(3).max(50).trim().strict(),
  description: Joi.string().optional(),

  createdAt: Joi.date().timestamp("javascript").default(Date.now),
  updatedAt: Joi.date().timestamp("javascript").default(null),
  _destroy: Joi.boolean().default(false),
});

const getCollection = () => GET_DB().collection(CARD_COLLECTION_NAME);

const validateBeforeCreate = async (data) => {
  return await CARD_COLLECTION_SCHEMA.validateAsync(data, {
    abortEarly: false,
  });
};

const createNew = async (data) => {
  const validData = await validateBeforeCreate(data);
  const newCard = {
    ...validData,
    boardId: new ObjectId(validData.boardId),
    columnId: new ObjectId(validData.columnId),
  };
  return await getCollection().insertOne(newCard);
};

const generatePlaceholderCard = async (data) => {
  const placeholderCard = {
    _id: `${data._id}-placeholder-card`,
    boardId: new ObjectId(data.boardId),
    columnId: new ObjectId(data._id),
    FE_PlaceholderCard: true,
  };
  return await getCollection().insertOne(placeholderCard);
};

const findOneById = async (id) => {
  return await getCollection().findOne({ _id: new ObjectId(id) });
};

const update = async (cardId, updateData) => {
  if (updateData.columnId) {
    updateData.columnId = new ObjectId(updateData.columnId);
  }

  return await getCollection().findOneAndUpdate(
    { _id: new ObjectId(cardId) },
    { $set: { ...updateData, updatedAt: Date.now() } },
    { returnDocument: "after" }
  );
};

const deleteOneById = async (cardId) => {
  const result = await getCollection().deleteOne({ _id: new ObjectId(cardId) });
  // if (result.deletedCount === 0) {
  //   throw new Error(`Card with id ${cardId} not found or already deleted`);
  // }
  return result;
};

const removeCardsByColumnId = async (columnId) => {
  return await getCollection().deleteMany({ columnId: new ObjectId(columnId) });
};

export const cardModel = {
  CARD_COLLECTION_NAME,
  CARD_COLLECTION_SCHEMA,
  createNew,
  findOneById,
  update,
  generatePlaceholderCard,
  deleteOneById,
  removeCardsByColumnId,
};
