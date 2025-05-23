/* eslint-disable no-useless-catch */
import { ObjectId } from "mongodb";
import { boardModel } from "~/models/boardModel";
import { columnModel } from "~/models/columnModel";

const createNew = async (reqBody) => {
  try {
    const newColumn = {
      ...reqBody,
      boardId: new ObjectId(reqBody.boardId).toString(),
    };
    const createdColumn = await columnModel.createNew(newColumn);
    const newColumnId = createdColumn.insertedId;

    const getNewColumn = await columnModel.findOneById(
      new ObjectId(newColumnId)
    );

    await boardModel.updateColumnOrderIds(
      getNewColumn.boardId.toString(),
      newColumnId
    );
    return getNewColumn;
  } catch (error) {
    throw error;
  }
};

export const columnService = {
  createNew,
};
