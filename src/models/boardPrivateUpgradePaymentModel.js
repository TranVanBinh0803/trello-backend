import Joi from "joi";
import { ObjectId } from "mongodb";
import { GET_DB } from "~/config/mongodb";
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from "~/utils/validators";

const BOARD_PRIVATE_UPGRADE_PAYMENT_COLLECTION_NAME =
  "boardPrivateUpgradePayments";

const BOARD_PRIVATE_UPGRADE_PAYMENT_STATUS = {
  PENDING: "pending",
  PAID: "paid",
  FAILED: "failed",
};

const BOARD_PRIVATE_UPGRADE_PAYMENT_COLLECTION_SCHEMA = Joi.object({
  boardId: Joi.string()
    .required()
    .pattern(OBJECT_ID_RULE)
    .message(OBJECT_ID_RULE_MESSAGE),
  userId: Joi.string()
    .required()
    .pattern(OBJECT_ID_RULE)
    .message(OBJECT_ID_RULE_MESSAGE),
  txnRef: Joi.string().required().min(1).max(100).trim().strict(),
  amount: Joi.number().integer().min(1000).required(),
  status: Joi.string()
    .valid(
      BOARD_PRIVATE_UPGRADE_PAYMENT_STATUS.PENDING,
      BOARD_PRIVATE_UPGRADE_PAYMENT_STATUS.PAID,
      BOARD_PRIVATE_UPGRADE_PAYMENT_STATUS.FAILED
    )
    .default(BOARD_PRIVATE_UPGRADE_PAYMENT_STATUS.PENDING),
  vnpTransactionNo: Joi.string().allow(null, "").default(null),
  vnpResponseCode: Joi.string().allow(null, "").default(null),
  createdAt: Joi.date().timestamp("javascript").default(Date.now),
  updatedAt: Joi.date().timestamp("javascript").default(null),
});

const getCollection = () =>
  GET_DB().collection(BOARD_PRIVATE_UPGRADE_PAYMENT_COLLECTION_NAME);

const validateBeforeCreate = async (data) => {
  return await BOARD_PRIVATE_UPGRADE_PAYMENT_COLLECTION_SCHEMA.validateAsync(data, {
    abortEarly: false,
  });
};

const createNew = async (data) => {
  const validData = await validateBeforeCreate(data);
  const newPayment = {
    ...validData,
    boardId: new ObjectId(validData.boardId),
    userId: new ObjectId(validData.userId),
  };
  return await getCollection().insertOne(newPayment);
};

const findOneByTxnRef = async (txnRef) => {
  return await getCollection().findOne({ txnRef });
};

const updateStatus = async (txnRef, updateData) => {
  return await getCollection().findOneAndUpdate(
    { txnRef },
    {
      $set: {
        ...updateData,
        updatedAt: Date.now(),
      },
    },
    { returnDocument: "after" }
  );
};

export const boardPrivateUpgradePaymentModel = {
  BOARD_PRIVATE_UPGRADE_PAYMENT_COLLECTION_NAME,
  BOARD_PRIVATE_UPGRADE_PAYMENT_STATUS,
  createNew,
  findOneByTxnRef,
  updateStatus,
};
