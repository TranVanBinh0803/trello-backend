import { StatusCodes } from "http-status-codes";
import { userService } from "~/services/userService";
import { ApiResponse } from "~/utils/types";

const updateProfile = async (req, res) => {
  const userId = req.user?._id;
  const updateData = req.body;
  const updatedUser = await userService.updateProfile(
    userId,
    updateData,
    req.file
  );
  res
    .status(StatusCodes.OK)
    .json(
      new ApiResponse(
        StatusCodes.OK,
        "Update profile successfully",
        updatedUser
      )
    );
};

const getUser = async (req, res) => {
  const userId = req.params.id;
  const user = await userService.getUser(userId);
  res
    .status(StatusCodes.OK)
    .json(new ApiResponse(StatusCodes.OK, "Get user successfully", user));
};

const getBoardInvitations = async (req, res) => {
  const invitations = await userService.getBoardInvitations(req.user?._id);
  res
    .status(StatusCodes.OK)
    .json(
      new ApiResponse(
        StatusCodes.OK,
        "Get board invitations successfully",
        invitations
      )
    );
};

const acceptBoardInvitation = async (req, res) => {
  const invitation = await userService.acceptBoardInvitation(
    req.user?._id,
    req.params.invitationId
  );
  res
    .status(StatusCodes.OK)
    .json(
      new ApiResponse(
        StatusCodes.OK,
        "Accept board invitation successfully",
        invitation
      )
    );
};

const rejectBoardInvitation = async (req, res) => {
  const invitation = await userService.rejectBoardInvitation(
    req.user?._id,
    req.params.invitationId
  );
  res
    .status(StatusCodes.OK)
    .json(
      new ApiResponse(
        StatusCodes.OK,
        "Reject board invitation successfully",
        invitation
      )
    );
};

export const userController = {
  updateProfile,
  getUser,
  getBoardInvitations,
  acceptBoardInvitation,
  rejectBoardInvitation,
};
