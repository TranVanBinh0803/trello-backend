import { StatusCodes } from "http-status-codes";
import { ObjectId } from "mongodb";
import { boardModel } from "~/models/boardModel";
import { cardModel } from "~/models/cardModel";
import { columnModel } from "~/models/columnModel";
import {
  assertBoardMember,
  assertBoardMemberByColumnId,
} from "~/utils/boardPermissions";
import { ApiError } from "~/utils/types";

const buildRestoredCardOrderIds = (column, card) => {
  const activeCardIds = new Set(
    column.cardOrderIds?.map((cardId) => cardId.toString()) || []
  );
  const restoreCardId = card._id.toString();
  const previousCardOrderIds =
    card.previousCardOrderIds?.map((cardId) => cardId.toString()) || [];

  return previousCardOrderIds.filter(
    (cardId) => cardId === restoreCardId || activeCardIds.has(cardId)
  );
};

const createNew = async (data, userId) => {
  await assertBoardMember(data.boardId, userId);
  const createdColumn = await columnModel.createNew(data);
  const newColumnId = createdColumn.insertedId;

  const getNewColumn = await columnModel.findOneById(new ObjectId(newColumnId));

  await boardModel.updateColumnOrderIds(getNewColumn.boardId.toString(), newColumnId);

  await cardModel.generatePlaceholderCard(getNewColumn);
  return getNewColumn;
};

const dragCard = async (columnId, cardOrderIds, userId) => {
  if (!ObjectId.isValid(columnId)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid columnId!");
  }

  await assertBoardMemberByColumnId(columnId, userId);
  const filteredCardIds = cardOrderIds.filter(
    (id) => !id.endsWith("-placeholder-card")
  );
  const objectIdArray = filteredCardIds.map((id) => new ObjectId(id));

  const updatedColumn = await columnModel.updateCardOrderIds(columnId, objectIdArray);

  if (!updatedColumn) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Column update failed!");
  }

  return updatedColumn;
};

const dragCardBetweenColumn = async (
  oldColumnId,
  oldCardOrderIds,
  newColumnId,
  newCardOrderIds,
  cardId,
  userId
) => {
  if (!ObjectId.isValid(oldColumnId) || !ObjectId.isValid(newColumnId)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid columnId!");
  }

  const oldColumn = await assertBoardMemberByColumnId(oldColumnId, userId);
  const newColumn = await assertBoardMemberByColumnId(newColumnId, userId);
  if (oldColumn.boardId.toString() !== newColumn.boardId.toString()) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Columns must be in same board!");
  }

  const filteredOldCardIds = oldCardOrderIds.filter(
    (id) => !id.endsWith("-placeholder-card")
  );
  const oldObjectIdArray = filteredOldCardIds.map((id) => new ObjectId(id));

  const filteredNewCardIds = newCardOrderIds.filter(
    (id) => !id.endsWith("-placeholder-card")
  );
  const newObjectIdArray = filteredNewCardIds.map((id) => new ObjectId(id));

  const updatedColumn = await columnModel.dragCardBetweenColumn(
    oldColumnId,
    oldObjectIdArray,
    newColumnId,
    newObjectIdArray,
    cardId
  );

  if (!updatedColumn) {
    throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, "Column update failed!");
  }

  return updatedColumn;
};

const archiveCard = async (columnId, data, userId) => {
  if (!ObjectId.isValid(columnId)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid columnId!");
  }
  if (!ObjectId.isValid(data.cardId)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid cardId!");
  }
  const column = await assertBoardMemberByColumnId(columnId, userId);
  const cardExists = column.cardOrderIds.some(
    (id) => id.toString() === data.cardId
  );
  if (!cardExists) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Card not found in this column!");
  }
  const result = await columnModel.archiveCard(columnId, data, {
    archivedBy: userId.toString(),
  });

  if (!result) {
    throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, "Card delete failed!");
  }
  return result;
};

const restoreCard = async (columnId, cardId, userId) => {
  if (!ObjectId.isValid(columnId)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid columnId!");
  }
  if (!ObjectId.isValid(cardId)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid cardId!");
  }

  const column = await assertBoardMemberByColumnId(columnId, userId);
  const card = await cardModel.findOneById(cardId);
  if (!card || !card._destroy) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Archived card not found!");
  }
  if (card.archiveType !== "card") {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "This card belongs to an archived column. Restore the column first!"
    );
  }
  if (card.boardId.toString() !== column.boardId.toString()) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Card does not belong to column!");
  }

  const targetColumnId = card.previousColumnId || columnId;
  if (targetColumnId.toString() !== columnId) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Card restore column is invalid!");
  }

  const restoredCardOrderIds = buildRestoredCardOrderIds(column, card);
  const updatedColumn = await columnModel.restoreCardOrderIds(
    columnId,
    restoredCardOrderIds,
    cardId
  );
  await cardModel.restoreOneById(cardId, columnId);

  if (!updatedColumn) {
    throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, "Restore card failed!");
  }

  return updatedColumn;
};

export const columnService = {
  createNew,
  dragCard,
  dragCardBetweenColumn,
  archiveCard,
  restoreCard,
};
