/* eslint-disable no-useless-catch */
import { StatusCodes } from "http-status-codes";
import { ObjectId } from "mongodb";
import { boardModel } from "~/models/boardModel";
import { cardModel } from "~/models/cardModel";
import { columnModel } from "~/models/columnModel";
import { ApiError } from "~/utils/types";

const createNew = async (reqBody) => {
  try {
    const newColumn = {
      ...reqBody,
      boardId: new ObjectId(reqBody.boardId).toString(),
    };
    const createdColumn = await columnModel.createNew(newColumn);

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

    const column = await columnModel.findOneById(new ObjectId(columnId));
    if (!column) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Column not found!");
    }

    const objectIdArray = cardOrderIds.map((id) => new ObjectId(id));

    const updatedColumn = await columnModel.dragCard(columnId, objectIdArray);

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
  cardId,
) => {
  try {
    if (!ObjectId.isValid(oldColumnId) || !ObjectId.isValid(newColumnId)) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid columnId!");
    }

    const updatedColumn = await columnModel.dragCardBetweenColumn(
      oldColumnId,
      oldCardOrderIds,
      newColumnId,
      newCardOrderIds,
      cardId,
    );

    if (!updatedColumn) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Column update failed!");
    }

    return updatedColumn;
  } catch (error) {
    throw error;
  }
};

export const columnService = {
  createNew,
  dragCard,
  dragCardBetweenColumn,
};
