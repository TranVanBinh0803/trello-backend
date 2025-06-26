import jwt from "jsonwebtoken";

export const generateToken = (userId) => {
  const expiresInSecs = 3600; 
  const token = jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: expiresInSecs } 
  );
  return { token, expiresInSecs };
};