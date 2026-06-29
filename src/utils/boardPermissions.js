import { StatusCodes } from "http-status-codes";
import { ObjectId } from "mongodb";
import { boardModel } from "~/models/boardModel";
import { cardModel } from "~/models/cardModel";
import { columnModel } from "~/models/columnModel";
import { ApiError } from "~/utils/types";
import { BOARD_TYPES } from "./constants";

const isObjectId = (id) => ObjectId.isValid(id);

const isMember = (board, userId) =>
  Boolean(
    userId &&
      board.memberIds?.some((memberId) => memberId.toString() === userId.toString())
  );

const getActiveBoard = async (boardId) => {
  if (!isObjectId(boardId)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid boardId!");
  }

  const board = await boardModel.findOneById(boardId);
  if (!board || board._destroy) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Board not found!");
  }

  return board;
};

export const assertCanReadBoard = async (boardId, userId) => {
  const board = await getActiveBoard(boardId);
  if (board.type === BOARD_TYPES.PUBLIC || isMember(board, userId)) {
    return board;
  }

  throw new ApiError(StatusCodes.FORBIDDEN, "You cannot access this board!");
};

export const assertBoardMember = async (boardId, userId) => {
  if (!isObjectId(userId)) {
    throw new ApiError(StatusCodes.FORBIDDEN, "You must join this board first!");
  }

  const board = await getActiveBoard(boardId);
  if (isMember(board, userId)) {
    return board;
  }

  throw new ApiError(StatusCodes.FORBIDDEN, "You must join this board first!");
};

export const assertBoardMemberByColumnId = async (columnId, userId) => {
  if (!isObjectId(columnId)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid columnId!");
  }

  const column = await columnModel.findOneById(columnId);
  if (!column) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Column not found!");
  }

  await assertBoardMember(column.boardId, userId);
  return column;
};

export const assertBoardMemberByCardId = async (cardId, userId) => {
  if (!isObjectId(cardId)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid cardId!");
  }

  const card = await cardModel.findOneById(cardId);
  if (!card) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Card not found!");
  }

  await assertBoardMember(card.boardId, userId);
  return card;
};

export const assertCanReadBoardByCardId = async (cardId, userId) => {
  if (!isObjectId(cardId)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid cardId!");
  }

  const card = await cardModel.findOneById(cardId);
  if (!card) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Card not found!");
  }

  await assertCanReadBoard(card.boardId, userId);
  return card;
};
