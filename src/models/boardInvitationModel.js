const Joi = require("joi");
import { ObjectId } from "mongodb";
import { GET_DB } from "~/config/mongodb";
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from "~/utils/validators";
import { boardModel } from "./boardModel";
import { userModel } from "./userModel";

const BOARD_INVITATION_COLLECTION_NAME = "boardInvitations";

const INVITATION_STATUS = {
  PENDING: "pending",
  ACCEPTED: "accepted",
  REJECTED: "rejected",
};

const BOARD_INVITATION_COLLECTION_SCHEMA = Joi.object({
  boardId: Joi.string()
    .pattern(OBJECT_ID_RULE)
    .message(OBJECT_ID_RULE_MESSAGE)
    .required(),
  inviterId: Joi.string()
    .pattern(OBJECT_ID_RULE)
    .message(OBJECT_ID_RULE_MESSAGE)
    .required(),
  inviteeId: Joi.string()
    .pattern(OBJECT_ID_RULE)
    .message(OBJECT_ID_RULE_MESSAGE)
    .required(),
  status: Joi.string()
    .valid(
      INVITATION_STATUS.PENDING,
      INVITATION_STATUS.ACCEPTED,
      INVITATION_STATUS.REJECTED
    )
    .default(INVITATION_STATUS.PENDING),
  createdAt: Joi.date().timestamp("javascript").default(Date.now),
  updatedAt: Joi.date().timestamp("javascript").default(null),
});

const getCollection = () => GET_DB().collection(BOARD_INVITATION_COLLECTION_NAME);

const validateBeforeCreate = async (data) => {
  return await BOARD_INVITATION_COLLECTION_SCHEMA.validateAsync(data, {
    abortEarly: false,
  });
};

const createNew = async (data) => {
  const validData = await validateBeforeCreate(data);
  return await getCollection().insertOne({
    ...validData,
    boardId: new ObjectId(validData.boardId),
    inviterId: new ObjectId(validData.inviterId),
    inviteeId: new ObjectId(validData.inviteeId),
  });
};

const findPendingByBoardAndInvitee = async (boardId, inviteeId) => {
  return await getCollection().findOne({
    boardId: new ObjectId(boardId),
    inviteeId: new ObjectId(inviteeId),
    status: INVITATION_STATUS.PENDING,
  });
};

const findOneById = async (invitationId) => {
  return await getCollection().findOne({ _id: new ObjectId(invitationId) });
};

const getPendingByInvitee = async (inviteeId) => {
  return await getCollection()
    .aggregate([
      {
        $match: {
          inviteeId: new ObjectId(inviteeId),
          status: INVITATION_STATUS.PENDING,
        },
      },
      {
        $lookup: {
          from: boardModel.BOARD_COLLECTION_NAME,
          localField: "boardId",
          foreignField: "_id",
          as: "board",
        },
      },
      {
        $lookup: {
          from: userModel.USER_COLLECTION_NAME,
          localField: "inviterId",
          foreignField: "_id",
          as: "inviter",
        },
      },
      {
        $unwind: "$board",
      },
      {
        $unwind: "$inviter",
      },
      {
        $project: {
          "inviter.password": 0,
        },
      },
      {
        $sort: { createdAt: -1 },
      },
    ])
    .toArray();
};

const updateStatus = async (invitationId, status) => {
  return await getCollection().findOneAndUpdate(
    { _id: new ObjectId(invitationId) },
    { $set: { status, updatedAt: Date.now() } },
    { returnDocument: "after" }
  );
};

export const boardInvitationModel = {
  BOARD_INVITATION_COLLECTION_NAME,
  INVITATION_STATUS,
  createNew,
  findPendingByBoardAndInvitee,
  findOneById,
  getPendingByInvitee,
  updateStatus,
};
