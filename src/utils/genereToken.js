import jwt from "jsonwebtoken";

export const generateToken = (userId) => {
  const token = jwt.sign({ userId: userId }, process.env.JWT_SECRET, {
    expiresIn: "30s",
  });

  return token;
};

export const generateRefreshToken = (userId) => {
  const refreshToken = jwt.sign(
    { userId: userId },
    process.env.JWT_REFRESH_SECRET,
    {
      expiresIn: "1y",
    }
  );
  return refreshToken;
};