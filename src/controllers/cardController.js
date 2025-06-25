import { StatusCodes } from "http-status-codes";
import { cardService } from "~/services/cardService";
import { ApiResponse } from "~/utils/types";

const createNew = async (req, res, next) => {
  try {
    const createCard = await cardService.createNew(req.body)
    res.status(StatusCodes.CREATED).json(new ApiResponse(StatusCodes.CREATED, "Create new card successfully", createCard));
  } catch (error) {
    next(error);
  }
};

const updateTitle = async (req, res, next) => {
  try {
    const cardId = req.params.id;
    const reqBody = req.body;
    
    const updatedCard = await cardService.updateTitle(cardId, reqBody);
    res
      .status(StatusCodes.OK)
      .json(new ApiResponse(StatusCodes.OK, "Card title updated successfully", updatedCard));
  } catch (error) {
    next(error);
  }
};

export const cardController = {
  createNew,
  updateTitle
};
