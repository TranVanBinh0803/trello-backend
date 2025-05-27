import { StatusCodes } from "http-status-codes";
import { columnService } from "~/services/columnService";
import { ApiResponse } from "~/utils/types";

const createNew = async (req, res, next) => {
  try {
    const createColumn = await columnService.createNew(req.body);
    res
      .status(StatusCodes.CREATED)
      .json(
        new ApiResponse(
          StatusCodes.CREATED,
          "Create new column successfully",
          createColumn
        )
      );
  } catch (error) {
    next(error);
  }
};

const dragCard = async (req, res, next) => {
  try {
    const columnId = req.params.id;
    const { cardOrderIds } = req.body;

    const updatedColumn = await columnService.dragCard(columnId, cardOrderIds);
    res
      .status(StatusCodes.OK)
      .json(
        new ApiResponse(
          StatusCodes.OK,
          "Card order updated successfully",
          updatedColumn
        )
      );
  } catch (error) {
    next(error);
  }
};

const dragCardBetweenColumn = async (req, res, next) => {
  try {
    const {
      oldColumnId,
      oldCardOrderIds,
      newColumnId,
      newCardOrderIds,
      cardId,
    } = req.body;

    const updatedColumn = await columnService.dragCardBetweenColumn(
      oldColumnId,
      oldCardOrderIds,
      newColumnId,
      newCardOrderIds,
      cardId
    );
    res
      .status(StatusCodes.OK)
      .json(
        new ApiResponse(
          StatusCodes.OK,
          "Card order updated successfully",
          updatedColumn
        )
      );
  } catch (error) {
    next(error);
  }
};

const archiveCard = async (req, res, next) => {
  try {
    const updatedColumn = await columnService.archiveCard(req.body);
    console.log("Req.body: ", req.body);
    res
      .status(StatusCodes.OK)
      .json(
        new ApiResponse(
          StatusCodes.OK,
          "Card archive successfully",
          updatedColumn
        )
      );
  } catch (error) {
    next(error);
  }
};

export const columnController = {
  createNew,
  dragCard,
  dragCardBetweenColumn,
  archiveCard,
};
