import { StatusCodes } from "http-status-codes";
import { boardService } from "~/services/boardService";
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

const getDetails = async (req, res) => {
  const boardId = req.params.id;
  const board = await boardService.getDetails(boardId);
  res
    .status(StatusCodes.OK)
    .json(new ApiResponse(StatusCodes.OK, "Get detail board successfully", board));
};

const dragColumn = async (req, res) => {
  const boardId = req.params.id;
  const { columnOrderIds } = req.body;

  const updatedBoard = await boardService.dragColumn(boardId, columnOrderIds);
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
  const updatedBoard = await boardService.archiveColumn(boardId, columnId);
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
  getDetails,
  dragColumn,
  archiveColumn,
  inviteMember,
  importFromTemplate,
  downloadImportTemplate,
};
