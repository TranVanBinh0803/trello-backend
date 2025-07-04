import Joi from "joi";
import { ObjectId } from "mongodb";
import { GET_DB } from "~/config/mongodb";
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from "~/utils/validators";

const CARD_COLLECTION_NAME = "cards";

const COMMENT_SCHEMA = Joi.object({
  _id: Joi.string().optional(), 
  authorName: Joi.string().required().min(1).max(100).trim(),
  avatar: Joi.string().uri().allow(null, "").optional(),
  content: Joi.string().required().min(1).max(1000).trim(),
  createdAt: Joi.date().timestamp("javascript").optional(),
  updatedAt: Joi.date().timestamp("javascript").optional(),
});

const ATTACHMENT_SCHEMA = Joi.object({
  _id: Joi.string().optional(), 
  fileUrl: Joi.string().required().min(1).max(100).trim(),
  fileName: Joi.string().required().min(1).max(1000).trim(),
  createdAt: Joi.date().timestamp("javascript").optional(),
  updatedAt: Joi.date().timestamp("javascript").optional(),
});

const CARD_COLLECTION_SCHEMA = Joi.object({
  boardId: Joi.string()
    .required()
    .pattern(OBJECT_ID_RULE)
    .message(OBJECT_ID_RULE_MESSAGE),
  columnId: Joi.string()
    .required()
    .pattern(OBJECT_ID_RULE)
    .message(OBJECT_ID_RULE_MESSAGE),

  title: Joi.string().required().min(3).max(50).trim().strict(),
  description: Joi.string().optional(),
  comments: Joi.array().items(COMMENT_SCHEMA).optional(),
  attachments: Joi.array().items(ATTACHMENT_SCHEMA).optional(),
  createdAt: Joi.date().timestamp("javascript").default(Date.now),
  updatedAt: Joi.date().timestamp("javascript").default(null),
  _destroy: Joi.boolean().default(false),
});

const getCollection = () => GET_DB().collection(CARD_COLLECTION_NAME);

const validateBeforeCreate = async (data) => {
  return await CARD_COLLECTION_SCHEMA.validateAsync(data, {
    abortEarly: false,
  });
};

const validateComment = async (data) => {
  return await COMMENT_SCHEMA.validateAsync(data, {
    abortEarly: false,
  });
};

const createNew = async (data) => {
  const validData = await validateBeforeCreate(data);
  const newCard = {
    ...validData,
    boardId: new ObjectId(validData.boardId),
    columnId: new ObjectId(validData.columnId),
  };
  return await getCollection().insertOne(newCard);
};

const generatePlaceholderCard = async (data) => {
  const placeholderCard = {
    _id: `${data._id}-placeholder-card`,
    boardId: new ObjectId(data.boardId),
    columnId: new ObjectId(data._id),
    FE_PlaceholderCard: true,
  };
  return await getCollection().insertOne(placeholderCard);
};

const findOneById = async (id) => {
  return await getCollection().findOne({ _id: new ObjectId(id) });
};

const update = async (cardId, updateData) => {
  if (updateData.columnId) {
    updateData.columnId = new ObjectId(updateData.columnId);
  }

  return await getCollection().findOneAndUpdate(
    { _id: new ObjectId(cardId) },
    { $set: { ...updateData, updatedAt: Date.now() } },
    { returnDocument: "after" }
  );
};

const addComment = async (cardId, commentData) => {
  const validCommentData = await validateComment(commentData);
  
  const newComment = {
    ...validCommentData,
    _id: new ObjectId(),
    createdAt: Date.now(),
    updatedAt: null,
  };

  return await getCollection().findOneAndUpdate(
    { _id: new ObjectId(cardId) },
    {
      $push: { comments: newComment },
      $set: { updatedAt: Date.now() },
    },
    { returnDocument: "after" }
  );
};

const deleteComment = async (cardId, commentId) => {
  return await getCollection().findOneAndUpdate(
    { _id: new ObjectId(cardId) },
    {
      $pull: { comments: { _id: new ObjectId(commentId) } },
      $set: { updatedAt: Date.now() },
    },
    { returnDocument: "after" }
  );
};

const updateComment = async (cardId, commentId, updateData) => {
  const filteredData = {
    'comments.$.content': updateData.content,
    'comments.$.updatedAt': Date.now(),
    'updatedAt': Date.now()
  };

  return await getCollection().findOneAndUpdate(
    { 
      _id: new ObjectId(cardId),
      'comments._id': new ObjectId(commentId)
    },
    { $set: filteredData },
    { returnDocument: "after" }
  );
};

const getCommentById = async (cardId, commentId) => {
  const card = await getCollection().findOne(
    { 
      _id: new ObjectId(cardId),
      'comments._id': new ObjectId(commentId)
    },
    { projection: { 'comments.$': 1 } }
  );
  return card && card.comments ? card.comments[0] : null;
};

const getComments = async (cardId) => {
  const card = await getCollection().findOne(
    { _id: new ObjectId(cardId) },
    { projection: { comments: 1 } }
  );
  return card ? card.comments || [] : [];
};

const addAttachment = async (cardId, attachmentData) => {
  
  const newAttachment = {
    ...attachmentData,
    _id: new ObjectId(),
    createdAt: Date.now(),
    updatedAt: null,
  };

  return await getCollection().findOneAndUpdate(
    { _id: new ObjectId(cardId) },
    {
      $push: { attachments: newAttachment },
      $set: { updatedAt: Date.now() },
    },
    { returnDocument: "after" }
  );
};

const deleteOneById = async (cardId) => {
  const result = await getCollection().deleteOne({ _id: new ObjectId(cardId) });
  return result;
};

const removeCardsByColumnId = async (columnId) => {
  return await getCollection().deleteMany({ columnId: new ObjectId(columnId) });
};

export const cardModel = {
  CARD_COLLECTION_NAME,
  CARD_COLLECTION_SCHEMA,
  createNew,
  findOneById,
  update,
  addComment,
  deleteComment,
  updateComment,
  getCommentById,
  getComments,
  generatePlaceholderCard,
  deleteOneById,
  removeCardsByColumnId,
  addAttachment
};
