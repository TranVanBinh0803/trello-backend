import bcryptjs from "bcryptjs";
import crypto from "crypto";
import { StatusCodes } from "http-status-codes";
import { passwordResetOtpModel } from "~/models/passwordResetOtpModel";
import { userModel } from "~/models/userModel";
import { sendResetPasswordOtpEmail } from "~/providers/mailProvider";
import { generateToken } from "~/utils/genereToken";
import { ApiError } from "~/utils/types";

const login = async (reqBody) => {
  const { email, password } = reqBody;
  const user = await userModel.findOneByEmail(email);
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User not found!");
  }
  const isPasswordValid = bcryptjs.compareSync(password, user.password);
  if (!isPasswordValid) {
    throw new ApiError(StatusCodes.FORBIDDEN, "Invalid credentials");
  }
  const { token: accessToken, expiresInSecs } = generateToken(user._id);
  // eslint-disable-next-line no-unused-vars
  const { password: _, ...userWithoutPassword } = user;

  return {
    accessToken,
    expiresInSecs,
    user: userWithoutPassword,
  };
};

const forgotPassword = async (reqBody) => {
  const { email } = reqBody;
  const user = await userModel.findOneByEmail(email);
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User not found!");
  }

  const otp = crypto.randomInt(100000, 1000000).toString();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 15);
  await passwordResetOtpModel.invalidatePendingByEmail(email);
  await passwordResetOtpModel.createNew({
    userId: user._id.toString(),
    email,
    otp,
    expiresAt,
  });
  await sendResetPasswordOtpEmail({
    to: email,
    otp,
  });

  return {
    email,
    expiresAt,
  };
};

const resetPassword = async (reqBody) => {
  const { email, otp, password } = reqBody;
  const passwordResetOtp = await passwordResetOtpModel.findValidByEmailAndOtp(
    email,
    otp
  );
  if (!passwordResetOtp) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid or expired OTP!");
  }

  const hashedPassword = bcryptjs.hashSync(password, bcryptjs.genSaltSync(10));
  await userModel.updatePassword(passwordResetOtp.userId, hashedPassword);
  await passwordResetOtpModel.markUsed(passwordResetOtp._id);

  return { email: passwordResetOtp.email };
};

export const authService = {
  login,
  forgotPassword,
  resetPassword,
};
