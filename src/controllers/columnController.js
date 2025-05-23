import { StatusCodes } from "http-status-codes";
import { columnService } from "~/services/columnService";
import { ApiResponse } from "~/utils/types";

const createNew = async (req, res, next) => {
  try {
    const createColumn = await columnService.createNew(req.body)
    res.status(StatusCodes.CREATED).json(new ApiResponse(StatusCodes.CREATED, "Create new column successfully", createColumn));
  } catch (error) {
    next(error);
  }
};

export const columnController = {
  createNew
};
