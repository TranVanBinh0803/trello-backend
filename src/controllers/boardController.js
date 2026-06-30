import { StatusCodes } from "http-status-codes";
import { boardService } from "~/services/boardService";
import { emitBoardEvent } from "~/sockets/socketServer";
import { ApiResponse } from "~/utils/types";

const createNew = async (req, res) => {
  const createBoard = await boardService.createNew(req.body, req.user?._id);
  res
    .status(StatusCodes.CREATED)
    .json(
      new ApiResponse(
        StatusCodes.CREATED,
        "Create new board successfully",
        createBoard
      )
    );
};

const getMyBoards = async (req, res) => {
  const boards = await boardService.getMyBoards(req.user?._id);
  res
    .status(StatusCodes.OK)
    .json(new ApiResponse(StatusCodes.OK, "Get my boards successfully", boards));
};

const getArchivedBoards = async (req, res) => {
  const boards = await boardService.getArchivedBoards(req.user?._id);
  res
    .status(StatusCodes.OK)
    .json(
      new ApiResponse(StatusCodes.OK, "Get archived boards successfully", boards)
    );
};

const getDetails = async (req, res) => {
  const boardId = req.params.id;
  const board = await boardService.getDetails(boardId, req.user?._id);
  res
    .status(StatusCodes.OK)
    .json(new ApiResponse(StatusCodes.OK, "Get detail board successfully", board));
};

const getArchivedItems = async (req, res) => {
  const boardId = req.params.id;
  const archivedItems = await boardService.getArchivedItems(
    boardId,
    req.user?._id
  );
  res
    .status(StatusCodes.OK)
    .json(
      new ApiResponse(
        StatusCodes.OK,
        "Get archived board items successfully",
        archivedItems
      )
    );
};

const dragColumn = async (req, res) => {
  const boardId = req.params.id;
  const { columnOrderIds } = req.body;

  const updatedBoard = await boardService.dragColumn(
    boardId,
    columnOrderIds,
    req.user?._id
  );
  emitBoardEvent(boardId, "board:column-updated", {
    actorId: req.user?._id?.toString(),
    columnOrderIds,
  });
  res
    .status(StatusCodes.OK)
    .json(
      new ApiResponse(
        StatusCodes.OK,
        "Column order updated successfully",
        updatedBoard
      )
    );
};

const archiveColumn = async (req, res) => {
  const boardId = req.params.id;
  const columnId = req.body;
  const updatedBoard = await boardService.archiveColumn(
    boardId,
    columnId,
    req.user?._id
  );
  emitBoardEvent(boardId, "board:column-archived", {
    actorId: req.user?._id?.toString(),
    columnId: columnId?.columnId,
  });
  res
    .status(StatusCodes.OK)
    .json(
      new ApiResponse(StatusCodes.OK, "Column archive successfully", updatedBoard)
    );
};

const inviteMember = async (req, res) => {
  const boardId = req.params.id;
  const { email } = req.body;
  const invitation = await boardService.inviteMember(boardId, email, req.user?._id);
  res
    .status(StatusCodes.CREATED)
    .json(
      new ApiResponse(
        StatusCodes.CREATED,
        "Board invitation sent successfully",
        invitation
      )
    );
};

const leaveBoard = async (req, res) => {
  const boardId = req.params.id;
  const updatedBoard = await boardService.leaveBoard(boardId, req.user?._id);
  res
    .status(StatusCodes.OK)
    .json(new ApiResponse(StatusCodes.OK, "Leave board successfully", updatedBoard));
};

const archiveBoard = async (req, res) => {
  const boardId = req.params.id;
  const archivedBoard = await boardService.archiveBoard(boardId, req.user?._id);
  res
    .status(StatusCodes.OK)
    .json(
      new ApiResponse(StatusCodes.OK, "Archive board successfully", archivedBoard)
    );
};

const createPrivateUpgradePayment = async (req, res) => {
  const boardId = req.params.id;
  const clientIp =
    req.headers["x-forwarded-for"]?.split(",")[0] ||
    req.socket.remoteAddress ||
    "127.0.0.1";
  const payment = await boardService.createPrivateUpgradePayment(
    boardId,
    req.user?._id,
    clientIp
  );
  res
    .status(StatusCodes.CREATED)
    .json(
      new ApiResponse(
        StatusCodes.CREATED,
        "Create private board upgrade payment successfully",
        payment
      )
    );
};

const handleVnpayPrivateUpgradeReturn = async (req, res) => {
  const redirectUrl = await boardService.handleVnpayPrivateUpgradeReturn(
    req.query
  );
  res.redirect(redirectUrl);
};

const restoreBoard = async (req, res) => {
  const boardId = req.params.id;
  const restoredBoard = await boardService.restoreBoard(boardId, req.user?._id);
  res
    .status(StatusCodes.OK)
    .json(
      new ApiResponse(StatusCodes.OK, "Restore board successfully", restoredBoard)
    );
};

const restoreColumn = async (req, res) => {
  const boardId = req.params.id;
  const columnId = req.params.columnId;
  const restoredColumn = await boardService.restoreColumn(
    boardId,
    columnId,
    req.user?._id
  );
  emitBoardEvent(boardId, "board:column-restored", {
    actorId: req.user?._id?.toString(),
    columnId,
  });
  res
    .status(StatusCodes.OK)
    .json(
      new ApiResponse(StatusCodes.OK, "Restore column successfully", restoredColumn)
    );
};

const importFromTemplate = async (req, res) => {
  const importedBoard = await boardService.importFromExcel(
    req.file,
    req.user?._id
  );
  res
    .status(StatusCodes.CREATED)
    .json(
      new ApiResponse(
        StatusCodes.CREATED,
        "Import board successfully",
        importedBoard
      )
    );
};

const downloadImportTemplate = async (req, res) => {
  const buffer = await boardService.buildImportTemplate();
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader(
    "Content-Disposition",
    "attachment; filename=trello-board-import-template.xlsx"
  );
  res.status(StatusCodes.OK).send(Buffer.from(buffer));
};

export const boardController = {
  createNew,
  getMyBoards,
  getArchivedBoards,
  getDetails,
  getArchivedItems,
  dragColumn,
  archiveColumn,
  inviteMember,
  leaveBoard,
  archiveBoard,
  createPrivateUpgradePayment,
  handleVnpayPrivateUpgradeReturn,
  restoreBoard,
  restoreColumn,
  importFromTemplate,
  downloadImportTemplate,
};
