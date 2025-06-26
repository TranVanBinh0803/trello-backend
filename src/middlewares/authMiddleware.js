import { StatusCodes } from "http-status-codes";
import jwt from "jsonwebtoken";
import { userModel } from "~/models/userModel";
import { ApiResponse } from "~/utils/types";

export const verifyToken = async (req, res, next) => {
  try {
    let token = req.headers.authorization;

    if (!token) {
      return res
      .status(StatusCodes.FORBIDDEN)
      .json(
        new ApiResponse(
          StatusCodes.FORBIDDEN,
          "You don't have permission to continue"
        )
      );
    }

    if (token.startsWith("Bearer ")) {
      token = token.slice(7, token.length).trimLeft();
    }

    /* Decode token để lấy id, tìm user đó bằng id và đẩy vào middleware tiếp theo */
    const decoded = jwt.decode(token);
    const user = await userModel.findOneById(decoded.userId);
    req.user = user;
    next();
  } catch (error) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json(
        new ApiResponse(
          StatusCodes.INTERNAL_SERVER_ERROR,
          "Error verifying token"
        )
      );
  }
};
