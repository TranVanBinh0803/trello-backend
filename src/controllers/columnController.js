import { StatusCodes } from "http-status-codes";
import { columnService } from "~/services/columnService";
import { ApiResponse } from "~/utils/types";

const createNew = async (req, res) => {
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
};

const dragCard = async (req, res) => {
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
};

const dragCardBetweenColumn = async (req, res) => {
  const { oldColumnId, oldCardOrderIds, newColumnId, newCardOrderIds, cardId } =
    req.body;

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
};

const archiveCard = async (req, res) => {
  const columnId = req.params.id;
  const cardId = req.body;
  const updatedColumn = await columnService.archiveCard(columnId, cardId);
  res
    .status(StatusCodes.OK)
    .json(
      new ApiResponse(StatusCodes.OK, "Card archive successfully", updatedColumn)
    );
};

export const columnController = {
  createNew,
  dragCard,
  dragCardBetweenColumn,
  archiveCard,
};
