import Joi from "joi";
import { ObjectId } from "mongodb";
import { GET_DB } from "~/config/mongodb";
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from "~/utils/validators";

const CARD_COLLECTION_NAME = "cards";

const COMMENT_SCHEMA = Joi.object({
  _id: Joi.string().optional(), 
  authorId: Joi.string()
    .pattern(OBJECT_ID_RULE)
    .message(OBJECT_ID_RULE_MESSAGE)
    .allow(null, "")
    .optional(),
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

const ACTIVITY_SCHEMA = Joi.object({
  _id: Joi.string().optional(),
  actorId: Joi.string().allow(null, "").optional(),
  actorName: Joi.string().required().min(1).max(100).trim(),
  actorAvatar: Joi.string().uri().allow(null, "").optional(),
  action: Joi.string().required().min(1).max(50).trim(),
  message: Joi.string().required().min(1).max(300).trim(),
  createdAt: Joi.date().timestamp("javascript").optional(),
});

const LABEL_SCHEMA = Joi.object({
  _id: Joi.string().optional(),
  title: Joi.string().allow("").max(50).default(""),
  color: Joi.string().required().min(1).max(30).trim(),
});

const CHECKLIST_ITEM_SCHEMA = Joi.object({
  _id: Joi.string().optional(),
  title: Joi.string().required().min(1).max(200).trim(),
  completed: Joi.boolean().default(false),
  createdAt: Joi.date().timestamp("javascript").optional(),
});

const CHECKLIST_SCHEMA = Joi.object({
  _id: Joi.string().optional(),
  title: Joi.string().required().min(1).max(100).trim(),
  items: Joi.array().items(CHECKLIST_ITEM_SCHEMA).default([]),
  createdAt: Joi.date().timestamp("javascript").optional(),
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
  completed: Joi.boolean().default(false),
  labels: Joi.array().items(LABEL_SCHEMA).default([]),
  startDate: Joi.string().allow(null, "").default(null),
  dueDate: Joi.string().allow(null, "").default(null),
  checklists: Joi.array().items(CHECKLIST_SCHEMA).default([]),
  comments: Joi.array().items(COMMENT_SCHEMA).optional(),
  attachments: Joi.array().items(ATTACHMENT_SCHEMA).optional(),
  activities: Joi.array().items(ACTIVITY_SCHEMA).default([]),
  createdAt: Joi.date().timestamp("javascript").default(Date.now),
  updatedAt: Joi.date().timestamp("javascript").default(null),
  archivedAt: Joi.date().timestamp("javascript").allow(null).default(null),
  archivedBy: Joi.string().allow(null).default(null),
  archiveType: Joi.string().allow(null).default(null),
  previousColumnId: Joi.string().allow(null).default(null),
  previousCardOrderIds: Joi.array()
    .items(Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE))
    .default([]),
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

const normalizeActivity = (activity) => ({
  ...activity,
  _id: new ObjectId(),
  createdAt: activity.createdAt || Date.now(),
});

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

const findArchivedByBoardId = async (boardId) => {
  return await getCollection()
    .find({
      boardId: new ObjectId(boardId),
      _destroy: true,
      archiveType: "card",
    })
    .sort({ archivedAt: -1, updatedAt: -1 })
    .toArray();
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

const pushActivities = async (cardId, activities) => {
  const normalizedActivities = activities.map(normalizeActivity);

  return await getCollection().findOneAndUpdate(
    { _id: new ObjectId(cardId) },
    {
      $push: { activities: { $each: normalizedActivities } },
      $set: { updatedAt: Date.now() },
    },
    { returnDocument: "after" }
  );
};

const pushActivity = async (cardId, activity) => {
  return await pushActivities(cardId, [activity]);
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

const getAttachmentById = async (cardId, attachmentId) => {
  const card = await getCollection().findOne(
    { 
      _id: new ObjectId(cardId),
      'attachments._id': new ObjectId(attachmentId)
    },
    { projection: { 'attachments.$': 1 } }
  );
  return card && card.attachments ? card.attachments[0] : null;
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

const updateAttachment = async (cardId, attachmentId, updateData) => {
  const filteredData = {
    'attachments.$.fileName': updateData.fileName,
    'attachments.$.updatedAt': Date.now(),
    'updatedAt': Date.now()
  };

  return await getCollection().findOneAndUpdate(
    { 
      _id: new ObjectId(cardId),
      'attachments._id': new ObjectId(attachmentId)
    },
    { $set: filteredData },
    { returnDocument: "after" }
  );
};

const deleteAttachment = async (cardId, attachmentId) => {
  return await getCollection().findOneAndUpdate(
    { _id: new ObjectId(cardId) },
    {
      $pull: { attachments: { _id: new ObjectId(attachmentId) } },
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

const archiveOneById = async (cardId, archiveData) => {
  const updateData = {
    _destroy: true,
    updatedAt: Date.now(),
    archivedAt: Date.now(),
    archivedBy: archiveData.archivedBy || null,
    archiveType: archiveData.archiveType || "card",
    previousColumnId: archiveData.previousColumnId || null,
    previousCardOrderIds: archiveData.previousCardOrderIds || [],
  };

  return await getCollection().findOneAndUpdate(
    { _id: new ObjectId(cardId), _destroy: false },
    { $set: updateData },
    { returnDocument: "after" }
  );
};

const archiveCardsByColumnId = async (columnId, archiveData) => {
  return await getCollection().updateMany(
    { columnId: new ObjectId(columnId), _destroy: false },
    {
      $set: {
        _destroy: true,
        updatedAt: Date.now(),
        archivedAt: Date.now(),
        archivedBy: archiveData.archivedBy || null,
        archiveType: archiveData.archiveType || "column",
        previousColumnId: columnId.toString(),
      },
    }
  );
};

const restoreOneById = async (cardId, columnId) => {
  return await getCollection().findOneAndUpdate(
    { _id: new ObjectId(cardId), _destroy: true },
    {
      $set: {
        _destroy: false,
        columnId: new ObjectId(columnId),
        updatedAt: Date.now(),
        archivedAt: null,
        archivedBy: null,
        archiveType: null,
        previousColumnId: null,
        previousCardOrderIds: [],
      },
    },
    { returnDocument: "after" }
  );
};

const restoreCardsByColumnId = async (columnId) => {
  return await getCollection().updateMany(
    {
      columnId: new ObjectId(columnId),
      _destroy: true,
      archiveType: "column",
    },
    {
      $set: {
        _destroy: false,
        updatedAt: Date.now(),
        archivedAt: null,
        archivedBy: null,
        archiveType: null,
        previousColumnId: null,
      },
    }
  );
};

export const cardModel = {
  CARD_COLLECTION_NAME,
  CARD_COLLECTION_SCHEMA,
  createNew,
  findOneById,
  findArchivedByBoardId,
  update,
  addComment,
  deleteComment,
  updateComment,
  getCommentById,
  getComments,
  generatePlaceholderCard,
  deleteOneById,
  removeCardsByColumnId,
  archiveOneById,
  archiveCardsByColumnId,
  restoreOneById,
  restoreCardsByColumnId,
  addAttachment,
  updateAttachment,
  deleteAttachment,
  getAttachmentById,
  pushActivity,
  pushActivities,
};
