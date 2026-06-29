import ExcelJS from "exceljs";
import { StatusCodes } from "http-status-codes";
import { cloneDeep } from "lodash";
import { ObjectId } from "mongodb";
import { boardModel } from "~/models/boardModel";
import { boardInvitationModel } from "~/models/boardInvitationModel";
import { boardPrivateUpgradePaymentModel } from "~/models/boardPrivateUpgradePaymentModel";
import { cardModel } from "~/models/cardModel";
import { columnModel } from "~/models/columnModel";
import { userModel } from "~/models/userModel";
import {
  assertBoardMember,
  assertCanReadBoard,
} from "~/utils/boardPermissions";
import { BOARD_TYPES } from "~/utils/constants";
import { slugify } from "~/utils/helpers";
import { ApiError } from "~/utils/types";
import { vnpayUtils } from "~/utils/vnpay";

const IMPORT_LABEL_COLORS = [
  "#4bce97",
  "#f5cd47",
  "#fea362",
  "#f87168",
  "#9f8fef",
  "#579dff",
];

const IMPORT_TEMPLATE_HEADERS = [
  "boardTitle",
  "boardDescription",
  "boardType",
  "columnTitle",
  "cardTitle",
  "description",
  "labels",
  "dueDate",
  "completed",
];

const mapCardsToColumns = (board) => {
  const resBoard = cloneDeep(board);
  resBoard.columns.forEach((column) => {
    column.cards = resBoard.cards.filter((card) => card.columnId.equals(column._id));
  });
  delete resBoard.cards;
  return resBoard;
};

const isBoardOwner = (board, userId) => {
  return board.ownerIds?.some((ownerId) => ownerId.toString() === userId.toString());
};

const buildRestoredColumnOrderIds = (board, column) => {
  const activeColumnIds = new Set(
    board.columnOrderIds?.map((columnId) => columnId.toString()) || []
  );
  const restoreColumnId = column._id.toString();
  const previousColumnOrderIds =
    column.previousBoardColumnOrderIds?.map((columnId) => columnId.toString()) || [];

  return previousColumnOrderIds.filter(
    (columnId) => columnId === restoreColumnId || activeColumnIds.has(columnId)
  );
};

const createNew = async (reqBody, ownerId) => {
  const memberIds = ownerId ? [new ObjectId(ownerId)] : [];
  const newBoard = {
    ...reqBody,
    type: BOARD_TYPES.PUBLIC,
    slug: slugify(reqBody.title),
    ownerIds: memberIds,
    memberIds,
  };

  const createdBoard = await boardModel.createNew(newBoard);
  const getNewBoard = await boardModel.findOneById(createdBoard.insertedId);
  return getNewBoard;
};

const getVnpayConfig = () => {
  if (!process.env.VNPAY_TMN_CODE || !process.env.VNPAY_HASH_SECRET) {
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      "VNPAY sandbox config is missing!"
    );
  }

  const appHost = process.env.APP_HOST;
  const appPort = process.env.APP_PORT;

  return {
    amount: Number(process.env.PRIVATE_BOARD_UPGRADE_AMOUNT || 10000),
    frontendUrl: process.env.FRONTEND_URL,
    hashSecret: process.env.VNPAY_HASH_SECRET,
    returnUrl:
      process.env.VNPAY_RETURN_URL ||
      `http://${appHost}:${appPort}/v1/boards/vnpay-return`,
    tmnCode: process.env.VNPAY_TMN_CODE,
  };
};

const buildPaymentRedirectUrl = (frontendUrl, boardId, status) => {
  return `${frontendUrl}/boards/${boardId}?payment=${status}`;
};

const createPrivateUpgradePayment = async (boardId, userId, clientIp) => {
  if (!ObjectId.isValid(boardId)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid boardId!");
  }
  if (!ObjectId.isValid(userId)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid userId!");
  }

  const board = await boardModel.findOneById(boardId);
  if (!board || board._destroy) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Board not found!");
  }
  if (!isBoardOwner(board, userId)) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      "Only board owners can upgrade this board!"
    );
  }
  if (board.type === BOARD_TYPES.PRIVATE) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Board is already private!");
  }

  const vnpayConfig = getVnpayConfig();
  const txnRef = `PRIVATE_${boardId}_${Date.now()}`;

  await boardPrivateUpgradePaymentModel.createNew({
    boardId,
    userId,
    txnRef,
    amount: vnpayConfig.amount,
  });

  return {
    amount: vnpayConfig.amount,
    paymentUrl: vnpayUtils.buildPaymentUrl({
      amount: vnpayConfig.amount,
      clientIp,
      hashSecret: vnpayConfig.hashSecret,
      orderInfo: `Upgrade board ${board.title} to private`,
      returnUrl: vnpayConfig.returnUrl,
      tmnCode: vnpayConfig.tmnCode,
      txnRef,
    }),
    txnRef,
  };
};

const handleVnpayPrivateUpgradeReturn = async (query) => {
  const vnpayConfig = getVnpayConfig();
  const txnRef = query.vnp_TxnRef;
  const payment = txnRef
    ? await boardPrivateUpgradePaymentModel.findOneByTxnRef(txnRef)
    : null;
  const boardId = payment?.boardId?.toString();
  const fallbackUrl = `${vnpayConfig.frontendUrl}/boards?payment=invalid`;

  if (!payment || !boardId) {
    return fallbackUrl;
  }

  const isValidSignature = vnpayUtils.verifyReturnParams(
    query,
    vnpayConfig.hashSecret
  );

  if (!isValidSignature) {
    await boardPrivateUpgradePaymentModel.updateStatus(txnRef, {
      status: boardPrivateUpgradePaymentModel
        .BOARD_PRIVATE_UPGRADE_PAYMENT_STATUS.FAILED,
      vnpResponseCode: query.vnp_ResponseCode || null,
      vnpTransactionNo: query.vnp_TransactionNo || null,
    });
    return buildPaymentRedirectUrl(vnpayConfig.frontendUrl, boardId, "invalid");
  }

  const isPaid =
    query.vnp_ResponseCode === "00" && query.vnp_TransactionStatus === "00";

  if (!isPaid) {
    await boardPrivateUpgradePaymentModel.updateStatus(txnRef, {
      status: boardPrivateUpgradePaymentModel
        .BOARD_PRIVATE_UPGRADE_PAYMENT_STATUS.FAILED,
      vnpResponseCode: query.vnp_ResponseCode || null,
      vnpTransactionNo: query.vnp_TransactionNo || null,
    });
    return buildPaymentRedirectUrl(vnpayConfig.frontendUrl, boardId, "failed");
  }

  await boardPrivateUpgradePaymentModel.updateStatus(txnRef, {
    status: boardPrivateUpgradePaymentModel.BOARD_PRIVATE_UPGRADE_PAYMENT_STATUS.PAID,
    vnpResponseCode: query.vnp_ResponseCode || null,
    vnpTransactionNo: query.vnp_TransactionNo || null,
  });
  await boardModel.updateType(boardId, BOARD_TYPES.PRIVATE, {
    privateUpgradedAt: Date.now(),
    privateUpgradeTxnRef: txnRef,
  });

  return buildPaymentRedirectUrl(vnpayConfig.frontendUrl, boardId, "success");
};

const getMyBoards = async (userId) => {
  if (!ObjectId.isValid(userId)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid userId!");
  }
  return await boardModel.findByMemberId(userId);
};

const getArchivedBoards = async (userId) => {
  if (!ObjectId.isValid(userId)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid userId!");
  }
  return await boardModel.findArchivedByMemberId(userId);
};

const getDetails = async (boardId, userId) => {
  await assertCanReadBoard(boardId, userId);
  const board = await boardModel.getDetails(boardId);
  if (!board) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Board not found!");
  }
  return mapCardsToColumns(board);
};

const getArchivedItems = async (boardId, userId) => {
  await assertBoardMember(boardId, userId);
  const [columns, cards] = await Promise.all([
    columnModel.findArchivedByBoardId(boardId),
    cardModel.findArchivedByBoardId(boardId),
  ]);

  return { columns, cards };
};

const dragColumn = async (boardId, columnOrderIds, userId) => {
  if (!ObjectId.isValid(boardId)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid boardId!");
  }
  await assertBoardMember(boardId, userId);
  const board = await boardModel.findOneById(boardId);
  if (!board) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Board not found!");
  }
  const objectIdArray = columnOrderIds.map((id) => new ObjectId(id));
  const updatedBoard = await boardModel.dragColumn(boardId, objectIdArray);

  if (!updatedBoard) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Board update failed!");
  }

  return updatedBoard;
};

const archiveColumn = async (boardId, data, userId) => {
  if (!ObjectId.isValid(boardId)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid boardId!");
  }
  if (!ObjectId.isValid(data.columnId)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid columnId!");
  }
  await assertBoardMember(boardId, userId);
  const board = await boardModel.findOneById(new ObjectId(boardId));
  if (!board) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Board not found!");
  }
  const columnExists = board.columnOrderIds.some(
    (id) => id.toString() === data.columnId
  );
  if (!columnExists) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Column not found in this board!");
  }
  const result = await boardModel.archiveColumn(boardId, data, {
    archivedBy: userId.toString(),
  });

  if (!result) {
    throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, "Column archive failed!");
  }
  return result;
};

const inviteMember = async (boardId, email, inviterId) => {
  if (!ObjectId.isValid(boardId)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid boardId!");
  }
  if (!ObjectId.isValid(inviterId)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid inviterId!");
  }

  const board = await boardModel.findOneById(boardId);
  if (!board) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Board not found!");
  }

  if (!isBoardOwner(board, inviterId)) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      "Only board owners can invite members!"
    );
  }

  const user = await userModel.findOneByEmail(email);
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User not found!");
  }

  const isAlreadyMember = board.memberIds?.some(
    (memberId) => memberId.toString() === user._id.toString()
  );
  if (isAlreadyMember) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "User is already a board member!");
  }

  const pendingInvitation =
    await boardInvitationModel.findPendingByBoardAndInvitee(boardId, user._id);
  if (pendingInvitation) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "User already has a pending invitation!"
    );
  }

  const createdInvitation = await boardInvitationModel.createNew({
    boardId,
    inviterId: inviterId.toString(),
    inviteeId: user._id.toString(),
  });

  return await boardInvitationModel.findOneById(createdInvitation.insertedId);
};

const leaveBoard = async (boardId, userId) => {
  if (!ObjectId.isValid(boardId)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid boardId!");
  }
  if (!ObjectId.isValid(userId)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid userId!");
  }

  const board = await boardModel.findOneById(boardId);
  if (!board) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Board not found!");
  }

  const isBoardMember = board.memberIds?.some(
    (memberId) => memberId.toString() === userId.toString()
  );
  if (!isBoardMember) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "You are not a board member!");
  }

  if (isBoardOwner(board, userId)) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      "Board owners cannot leave their own board!"
    );
  }

  const updatedBoard = await boardModel.removeMember(boardId, userId);
  if (!updatedBoard) {
    throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, "Leave board failed!");
  }

  return updatedBoard;
};

const archiveBoard = async (boardId, userId) => {
  if (!ObjectId.isValid(boardId)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid boardId!");
  }
  if (!ObjectId.isValid(userId)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid userId!");
  }

  const board = await boardModel.findOneById(boardId);
  if (!board || board._destroy) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Board not found!");
  }

  if (!isBoardOwner(board, userId)) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      "Only board owners can archive this board!"
    );
  }

  const archivedBoard = await boardModel.archiveBoard(boardId, {
    archivedBy: userId.toString(),
  });
  if (!archivedBoard) {
    throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, "Archive board failed!");
  }

  return archivedBoard;
};

const restoreBoard = async (boardId, userId) => {
  if (!ObjectId.isValid(boardId)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid boardId!");
  }
  if (!ObjectId.isValid(userId)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid userId!");
  }

  const board = await boardModel.findOneById(boardId);
  if (!board || !board._destroy) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Archived board not found!");
  }

  if (!isBoardOwner(board, userId)) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      "Only board owners can restore this board!"
    );
  }

  const restoredBoard = await boardModel.restoreBoard(boardId);
  if (!restoredBoard) {
    throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, "Restore board failed!");
  }

  return restoredBoard;
};

const restoreColumn = async (boardId, columnId, userId) => {
  if (!ObjectId.isValid(boardId)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid boardId!");
  }
  if (!ObjectId.isValid(columnId)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid columnId!");
  }

  const board = await assertBoardMember(boardId, userId);
  const column = await columnModel.findOneById(columnId);
  if (!column || !column._destroy) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Archived column not found!");
  }
  if (column.boardId.toString() !== boardId) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Column does not belong to board!");
  }

  const restoredColumnOrderIds = buildRestoredColumnOrderIds(board, column);
  await boardModel.restoreColumnOrderIds(
    boardId,
    restoredColumnOrderIds,
    columnId
  );

  const restoredColumn = await columnModel.restoreOneById(columnId);
  await cardModel.restoreCardsByColumnId(columnId);
  if (!restoredColumn) {
    throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, "Restore column failed!");
  }

  return restoredColumn;
};

const importFromTemplate = async (reqBody, ownerId) => {
  const { title, description, type, rows } = reqBody;
  const importedBoard = await createNew(
    {
      title,
      description,
      type,
    },
    ownerId
  );

  const rowsByColumn = rows.reduce((acc, row) => {
    const columnTitle = row.columnTitle.trim();
    if (!acc[columnTitle]) acc[columnTitle] = [];
    acc[columnTitle].push(row);
    return acc;
  }, {});

  for (const [columnTitle, columnRows] of Object.entries(rowsByColumn)) {
    const createdColumn = await columnModel.createNew({
      boardId: importedBoard._id.toString(),
      title: columnTitle,
    });
    const columnId = createdColumn.insertedId;
    await boardModel.updateColumnOrderIds(importedBoard._id.toString(), columnId);

    for (const row of columnRows) {
      if (!row.cardTitle?.trim()) continue;

      const createdCard = await cardModel.createNew({
        boardId: importedBoard._id.toString(),
        columnId: columnId.toString(),
        title: row.cardTitle.trim(),
        description: row.description || "",
        completed: Boolean(row.completed),
        dueDate: row.dueDate || null,
        labels: row.labels,
      });
      await columnModel.pushCardOrderIds(columnId.toString(), createdCard.insertedId);
    }
  }

  return await getDetails(importedBoard._id.toString());
};

const parseLabels = (value) => {
  if (!value) return [];
  return value
    .toString()
    .split(/[;,|]/)
    .map((label) => label.trim())
    .filter(Boolean)
    .map((label, index) => ({
      _id: `import-label-${label.toLowerCase().replace(/\s+/g, "-")}`,
      title: label,
      color: IMPORT_LABEL_COLORS[index % IMPORT_LABEL_COLORS.length],
    }));
};

const getCellText = (row, index) => {
  const value = row.getCell(index).value;
  if (!value) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "object" && value.text) return value.text.toString();
  if (typeof value === "object" && value.result) return value.result.toString();
  return value.toString();
};

const parseExcelImportFile = async (file) => {
  if (!file) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Excel import file is required!");
  }

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(file.buffer);
  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Excel file has no worksheet!");
  }

  const rows = [];
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const boardTitle = getCellText(row, 1);
    const boardDescription = getCellText(row, 2);
    const boardType = getCellText(row, 3);
    const columnTitle = getCellText(row, 4);
    const cardTitle = getCellText(row, 5);

    if (!boardTitle && !columnTitle && !cardTitle) return;

    rows.push({
      boardTitle,
      boardDescription,
      boardType,
      columnTitle,
      cardTitle,
      description: getCellText(row, 6),
      labels: parseLabels(getCellText(row, 7)),
      dueDate: getCellText(row, 8) || null,
      completed: getCellText(row, 9).toLowerCase() === "true",
    });
  });

  if (!rows.length) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Excel file has no import rows!");
  }

  const firstRow = rows[0];
  return {
    title: firstRow.boardTitle,
    description: firstRow.boardDescription,
    type: firstRow.boardType === "public" ? "public" : "private",
    rows: rows.map((row) => ({
      columnTitle: row.columnTitle,
      cardTitle: row.cardTitle,
      description: row.description,
      labels: row.labels,
      dueDate: row.dueDate,
      completed: row.completed,
    })),
  };
};

const importFromExcel = async (file, ownerId) => {
  const importData = await parseExcelImportFile(file);
  return await importFromTemplate(importData, ownerId);
};

const buildImportTemplate = async () => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Board import");
  worksheet.addRow(IMPORT_TEMPLATE_HEADERS);
  worksheet.addRows([
    [
      "Imported Project",
      "Board imported from Excel template",
      "public",
      "Todo",
      "Plan backlog",
      "Collect requirements",
      "Feature,Priority",
      "2026-07-01",
      "false",
    ],
    [
      "Imported Project",
      "Board imported from Excel template",
      "public",
      "Doing",
      "Build board import",
      "Implement parser and API",
      "Feature",
      "2026-07-03",
      "false",
    ],
    [
      "Imported Project",
      "Board imported from Excel template",
      "public",
      "Done",
      "Create sample file",
      "Template is ready",
      "Done",
      "2026-06-25",
      "true",
    ],
  ]);
  worksheet.columns.forEach((column) => {
    column.width = 24;
  });
  worksheet.getRow(1).font = { bold: true };
  return await workbook.xlsx.writeBuffer();
};

export const boardService = {
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
  restoreBoard,
  restoreColumn,
  createPrivateUpgradePayment,
  handleVnpayPrivateUpgradeReturn,
  importFromTemplate,
  importFromExcel,
  buildImportTemplate,
};
