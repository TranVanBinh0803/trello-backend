/* eslint-disable no-useless-catch */
import { StatusCodes } from "http-status-codes";
import { ObjectId } from "mongodb";
import { boardModel } from "~/models/boardModel";
import { cardModel } from "~/models/cardModel";
import { columnModel } from "~/models/columnModel";
import { ApiError } from "~/utils/types";

const createNew = async (data) => {
  try {
    const createdColumn = await columnModel.createNew(data);
    const newColumnId = createdColumn.insertedId;

    const getNewColumn = await columnModel.findOneById(
      new ObjectId(newColumnId)
    );

    await boardModel.updateColumnOrderIds(
      getNewColumn.boardId.toString(),
      newColumnId
    );

    await cardModel.generatePlaceholderCard(getNewColumn);
    return getNewColumn;
  } catch (error) {
    throw error;
  }
};

const dragCard = async (columnId, cardOrderIds) => {
  try {
    if (!ObjectId.isValid(columnId)) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid columnId!");
    }

    const column = await columnModel.findOneById(columnId);
    if (!column) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Column not found!");
    }
     const filteredCardIds = cardOrderIds.filter(id => !id.endsWith("-placeholder-card"));
    const objectIdArray = filteredCardIds.map((id) => new ObjectId(id));

    const updatedColumn = await columnModel.updateCardOrderIds(columnId, objectIdArray);

    if (!updatedColumn) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Column update failed!");
    }

    return updatedColumn;
  } catch (error) {
    throw error;
  }
};

const dragCardBetweenColumn = async (
  oldColumnId,
  oldCardOrderIds,
  newColumnId,
  newCardOrderIds,
  cardId
) => {
  try {
    if (!ObjectId.isValid(oldColumnId) || !ObjectId.isValid(newColumnId)) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid columnId!");
    }

    const filteredOldCardIds = oldCardOrderIds.filter(id => !id.endsWith("-placeholder-card"));
    const oldObjectIdArray = filteredOldCardIds.map(id => new ObjectId(id));

    const filteredNewCardIds = newCardOrderIds.filter(id => !id.endsWith("-placeholder-card"));
    const newObjectIdArray = filteredNewCardIds.map(id => new ObjectId(id));

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
  } catch (error) {
    throw error;
  }
};

const archiveCard = async (data) => {
  try {
    if (!ObjectId.isValid(data.columnId)) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid columnId!");
    }
    if (!ObjectId.isValid(data.cardId)) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid cardId!");
    }
    const column = await columnModel.findOneById(new ObjectId(data.columnId));
    if (!column) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Column not found!");
    }
    const cardExists = column.cardOrderIds.some(
      (id) => id.toString() === data.cardId
    );
    if (!cardExists) {
      throw new ApiError(
        StatusCodes.NOT_FOUND,
        "Card not found in this column!"
      );
    }
    const result = await columnModel.archiveCard(data);

    if (!result) {
      throw new ApiError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        "Card delete failed!"
      );
    }
    return result;
  } catch (error) {
    throw error;
  }
};

export const columnService = {
  createNew,
  dragCard,
  dragCardBetweenColumn,
  archiveCard,
};
