import { StatusCodes } from "http-status-codes";
import { columnService } from "~/services/columnService";
import { emitBoardEvent } from "~/sockets/socketServer";
import { ApiResponse } from "~/utils/types";

const createNew = async (req, res) => {
  const createColumn = await columnService.createNew(req.body, req.user?._id);
  emitBoardEvent(createColumn.boardId, "board:column-created", {
    columnId: createColumn._id?.toString(),
    actorId: req.user?._id?.toString(),
  });
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

  const updatedColumn = await columnService.dragCard(
    columnId,
    cardOrderIds,
    req.user?._id
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

const dragCardBetweenColumn = async (req, res) => {
  const { oldColumnId, oldCardOrderIds, newColumnId, newCardOrderIds, cardId } =
    req.body;

  const updatedColumn = await columnService.dragCardBetweenColumn(
    oldColumnId,
    oldCardOrderIds,
    newColumnId,
    newCardOrderIds,
    cardId,
    req.user?._id
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
  const updatedColumn = await columnService.archiveCard(
    columnId,
    cardId,
    req.user?._id
  );
  res
    .status(StatusCodes.OK)
    .json(
      new ApiResponse(StatusCodes.OK, "Card archive successfully", updatedColumn)
    );
};

const restoreCard = async (req, res) => {
  const columnId = req.params.id;
  const cardId = req.params.cardId;
  const updatedColumn = await columnService.restoreCard(
    columnId,
    cardId,
    req.user?._id
  );
  res
    .status(StatusCodes.OK)
    .json(
      new ApiResponse(StatusCodes.OK, "Restore card successfully", updatedColumn)
    );
};

export const columnController = {
  createNew,
  dragCard,
  dragCardBetweenColumn,
  archiveCard,
  restoreCard,
};
