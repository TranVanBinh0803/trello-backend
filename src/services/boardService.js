/* eslint-disable no-useless-catch */
import { StatusCodes } from "http-status-codes";
import { cloneDeep } from "lodash";
import { ObjectId } from "mongodb";
import { boardModel } from "~/models/boardModel";
import { slugify } from "~/utils/formatters";
import { ApiError } from "~/utils/types";

const createNew = async (reqBody) => {
  try {
    const newBoard = {
      ...reqBody,
      slug: slugify(reqBody.title),
    };

    const createdBoard = await boardModel.createNew(newBoard);
    const getNewBoard = await boardModel.findOneById(
      new ObjectId(createdBoard.insertedId)
    );
    return getNewBoard;
  } catch (error) {
    throw error;
  }
};

const getDetails = async (boardId) => {
  try {
    const board = await boardModel.getDetails(new ObjectId(boardId));
    if (!board) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Board not found!");
    }
    const resBoard = cloneDeep(board);
    resBoard.columns.forEach((column) => {
      column.cards = resBoard.cards.filter((card) =>
        card.columnId.equals(column._id)
      );
    });
    delete resBoard.cards;
    return resBoard;
  } catch (error) {
    throw error;
  }
};

const dragColumn = async (boardId, columnOrderIds) => {
  try {

    if (!ObjectId.isValid(boardId)) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid boardId!');
    }
    
    const board = await boardModel.findOneById(new ObjectId(boardId));
    if (!board) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Board not found!");
    }

    const objectIdArray = columnOrderIds.map(id => new ObjectId(id));

    const updatedBoard = await boardModel.dragColumn(boardId, objectIdArray);
    
    if (!updatedBoard) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Board update failed!");
    }

    return updatedBoard;
  } catch (error) {
    throw error;
  }
};

export const boardService = {
  createNew,
  getDetails,
  dragColumn
};
