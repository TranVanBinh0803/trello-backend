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

export const cardController = {
  createNew
};
