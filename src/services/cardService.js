/* eslint-disable no-useless-catch */
import { ObjectId } from "mongodb";
import { cardModel } from "~/models/cardModel";
import { columnModel } from "~/models/columnModel";

const createNew = async (reqBody) => {
  try {
    const createdCard = await cardModel.createNew(reqBody);
    const newCardId = createdCard.insertedId;

    const getNewCard = await cardModel.findOneById(
      new ObjectId(newCardId)
    );

    await columnModel.updateCardOrderIds(getNewCard.columnId.toString(), newCardId);
    return getNewCard;
  } catch (error) {
    throw error;
  }
};

export const cardService = {
  createNew,
};
