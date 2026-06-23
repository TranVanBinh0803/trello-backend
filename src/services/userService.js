import { PutObjectCommand } from "@aws-sdk/client-s3";
import bcryptjs from "bcryptjs";
import { StatusCodes } from "http-status-codes";
import { ObjectId } from "mongodb";
import { boardInvitationModel } from "~/models/boardInvitationModel";
import { boardModel } from "~/models/boardModel";
import { userModel } from "~/models/userModel";
import { s3 } from "~/utils/configAWS";
import { sanitizeFilename } from "~/utils/helpers";
import { ApiError } from "~/utils/types";

const createNew = async (reqBody) => {
  const { email, password } = reqBody;
  const existingUser = await userModel.findOneByEmail(email);
  if (existingUser) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Email is already registered");
  }
  const hashedPassword = bcryptjs.hashSync(password, bcryptjs.genSaltSync(10));
  const userData = {
    ...reqBody,
    password: hashedPassword,
  };
  const createdResult = await userModel.createNew(userData);
  const newUser = await userModel.findOneById(
    new ObjectId(createdResult.insertedId)
  );

  return newUser;
};

const getUser = async (userId) => {
  const user = await userModel.findOneById(userId);
  return user;
};

const uploadAvatarToS3 = async (userId, file) => {
  if (!file.mimetype.startsWith("image/")) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Avatar must be an image!");
  }

  const bucket =
    process.env.S3_AVATAR_BUCKET || process.env.S3_ATTACHMENT_BUCKET;
  if (!bucket) {
    throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, "S3 bucket is missing!");
  }

  const sanitizedFilename = sanitizeFilename(file.originalname);
  const s3Key = `avatars/${userId}-${Date.now()}-${sanitizedFilename}`;
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: s3Key,
    Body: file.buffer,
    ContentType: file.mimetype,
  });

  await s3.send(command);
  return `https://${bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`;
};

const updateProfile = async (userId, data, avatarFile) => {
  if (!ObjectId.isValid(userId)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid userId!");
  }
  const user = await userModel.findOneById(new ObjectId(userId));
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, "user not found!");
  }
  const updateData = {
    username: data.username,
  };
  if (avatarFile) {
    updateData.avatar = await uploadAvatarToS3(userId.toString(), avatarFile);
  }
  const updatedUser = await userModel.updateProfile(userId, updateData);
  // eslint-disable-next-line no-unused-vars
  const { password, ...userWithoutPassword } = updatedUser;
  return userWithoutPassword;
};

const getBoardInvitations = async (userId) => {
  if (!ObjectId.isValid(userId)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid userId!");
  }

  return await boardInvitationModel.getPendingByInvitee(userId);
};

const acceptBoardInvitation = async (userId, invitationId) => {
  if (!ObjectId.isValid(userId)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid userId!");
  }
  if (!ObjectId.isValid(invitationId)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid invitationId!");
  }

  const invitation = await boardInvitationModel.findOneById(invitationId);
  if (!invitation) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Invitation not found!");
  }
  if (invitation.inviteeId.toString() !== userId.toString()) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      "You cannot accept this invitation!"
    );
  }
  if (invitation.status !== boardInvitationModel.INVITATION_STATUS.PENDING) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Invitation is not pending!");
  }

  await boardModel.addMember(invitation.boardId, userId);
  return await boardInvitationModel.updateStatus(
    invitationId,
    boardInvitationModel.INVITATION_STATUS.ACCEPTED
  );
};

const rejectBoardInvitation = async (userId, invitationId) => {
  if (!ObjectId.isValid(userId)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid userId!");
  }
  if (!ObjectId.isValid(invitationId)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid invitationId!");
  }

  const invitation = await boardInvitationModel.findOneById(invitationId);
  if (!invitation) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Invitation not found!");
  }
  if (invitation.inviteeId.toString() !== userId.toString()) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      "You cannot reject this invitation!"
    );
  }
  if (invitation.status !== boardInvitationModel.INVITATION_STATUS.PENDING) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Invitation is not pending!");
  }

  return await boardInvitationModel.updateStatus(
    invitationId,
    boardInvitationModel.INVITATION_STATUS.REJECTED
  );
};

export const userService = {
  createNew,
  getUser,
  updateProfile,
  getBoardInvitations,
  acceptBoardInvitation,
  rejectBoardInvitation,
};
