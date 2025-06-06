import { StatusCodes } from "http-status-codes";
import { boardService } from "~/services/boardService";
import { ApiResponse } from "~/utils/types";

const createNew = async (req, res, next) => {
  try {
    const createBoard = await boardService.createNew(req.body);
    res.status(StatusCodes.CREATED).json(new ApiResponse(StatusCodes.CREATED, "Create new board successfully", createBoard));
  } catch (error) {
    next(error);
  }
};

const getDetails = async (req, res, next) => {
  try {
    const boardId = req.params.id;
    const board = await boardService.getDetails(boardId);
    res
      .status(StatusCodes.OK)
      .json(new ApiResponse(StatusCodes.OK, "Get detail board successfully", board));
  } catch (error) {
    next(error);
  }
};

const dragColumn = async (req, res, next) => {
  try {
    const boardId = req.params.id;
    const { columnOrderIds } = req.body;
    
    const updatedBoard = await boardService.dragColumn(boardId, columnOrderIds);
    res
      .status(StatusCodes.OK)
      .json(new ApiResponse(StatusCodes.OK, "Column order updated successfully", updatedBoard));
  } catch (error) {
    next(error);
  }
};

const archiveColumn = async (req, res, next) => {
  try {
    const boardId = req.params.id;
    const columnId = req.body;
    const updatedBoard = await boardService.archiveColumn(boardId, columnId);
    res
      .status(StatusCodes.OK)
      .json(
        new ApiResponse(
          StatusCodes.OK,
          "Column archive successfully",
          updatedBoard
        )
      );
  } catch (error) {
    next(error);
  }
};


export const boardController = {
  createNew,
  getDetails,
  dragColumn,
  archiveColumn
};
