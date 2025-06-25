import { genSalt, hash } from "bcrypt";

export const hashPassword = async (password) => {
  const salt = await genSalt(10);
  return await hash(password, salt);
};