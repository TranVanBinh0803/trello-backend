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
  archivedAt: Joi.date().timestamp("javascript").allow(null).default(null),
  archivedBy: Joi.string().allow(null).default(null),
  archiveType: Joi.string().allow(null).default(null),
  previousBoardColumnOrderIds: Joi.array()
    .items(Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE))
    .default([]),
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

const findArchivedByBoardId = async (boardId) => {
  return await getCollection()
    .find({
      boardId: new ObjectId(boardId),
      _destroy: true,
    })
    .sort({ archivedAt: -1, updatedAt: -1 })
    .toArray();
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

const pushCardOrderIds = async (columnId, cardId) => {
  return await getCollection().findOneAndUpdate(
    { _id: new ObjectId(columnId) },
    {
      $push: { cardOrderIds: new ObjectId(cardId) },
      $set: { updatedAt: Date.now() },
    },
    { returnDocument: "after" }
  );
};

const restoreCardOrderIds = async (columnId, previousCardOrderIds, cardId) => {
  const hasPreviousOrder = previousCardOrderIds?.length;
  const updateData = hasPreviousOrder
    ? {
        $set: {
          cardOrderIds: previousCardOrderIds.map((id) => new ObjectId(id)),
          updatedAt: Date.now(),
        },
      }
    : {
        $addToSet: { cardOrderIds: new ObjectId(cardId) },
        $set: { updatedAt: Date.now() },
      };

  return await getCollection().findOneAndUpdate(
    { _id: new ObjectId(columnId), _destroy: false },
    updateData,
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

const archiveCard = async (columnId, data, archiveData) => {
  const column = await findOneById(columnId);
  const updatedColumn = await pullCardOrderIds(columnId, data.cardId);
  await cardModel.archiveOneById(data.cardId, {
    archivedBy: archiveData.archivedBy,
    archiveType: "card",
    previousColumnId: columnId.toString(),
    previousCardOrderIds: column?.cardOrderIds || [],
  });
  return updatedColumn;
};

const archiveOneById = async (columnId, archiveData) => {
  const updatedColumn = await getCollection().findOneAndUpdate(
    { _id: new ObjectId(columnId), _destroy: false },
    {
      $set: {
        _destroy: true,
        updatedAt: Date.now(),
        archivedAt: Date.now(),
        archivedBy: archiveData.archivedBy || null,
        archiveType: archiveData.archiveType || "column",
        previousBoardColumnOrderIds: archiveData.previousBoardColumnOrderIds || [],
      },
    },
    { returnDocument: "after" }
  );

  await cardModel.archiveCardsByColumnId(columnId, {
    archivedBy: archiveData.archivedBy,
    archiveType: "column",
  });

  return updatedColumn;
};

const restoreOneById = async (columnId) => {
  return await getCollection().findOneAndUpdate(
    { _id: new ObjectId(columnId), _destroy: true },
    {
      $set: {
        _destroy: false,
        updatedAt: Date.now(),
        archivedAt: null,
        archivedBy: null,
        archiveType: null,
        previousBoardColumnOrderIds: [],
      },
    },
    { returnDocument: "after" }
  );
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
  findArchivedByBoardId,
  updateCardOrderIds,
  pullCardOrderIds,
  pushCardOrderIds,
  restoreCardOrderIds,
  dragCardBetweenColumn,
  archiveCard,
  archiveOneById,
  restoreOneById,
  deleteOneById,
};
