/* eslint-disable no-useless-catch */
import { StatusCodes } from "http-status-codes";
import { ObjectId } from "mongodb";
import { cardModel } from "~/models/cardModel";
import { columnModel } from "~/models/columnModel";
import { ApiError } from "~/utils/types";

const createNew = async (reqBody) => {
  try {
    const createdCard = await cardModel.createNew(reqBody);
    const newCardId = createdCard.insertedId;

    const getNewCard = await cardModel.findOneById(new ObjectId(newCardId));

    await columnModel.pushCardOrderIds(
      getNewCard.columnId.toString(),
      newCardId
    );
    return getNewCard;
  } catch (error) {
    throw error;
  }
};

const updateTitle = async (cardId, title) => {
  try {
    if (!ObjectId.isValid(cardId)) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid cardId!");
    }
    const card = await cardModel.findOneById(cardId);
    if (!card) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Card not found!");
    }
    const updatedCard = await cardModel.update(cardId, title);

    if (!updatedCard) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Card title update failed!");
    }

    return updatedCard;
  } catch (error) {
    throw error;
  }
};

export const cardService = {
  createNew,
  updateTitle,
};
