import prisma from "../../infrastructure/database/prisma";
import { RegisterInput } from "./auth.types";

 const saveRefreshToken = async (
  userId: string,
  token: string,
  expiresAt: Date,
) => {
  return prisma.refreshToken.create({
    data: {
      user_id: userId,
      token,
      expires_at: expiresAt,
    },
  });
};

 const findRefreshToken = async (token: string) => {
  return prisma.refreshToken.findUnique({
    where: { token },
  });
};

 const revokeRefreshToken = async (token: string) => {
  return prisma.refreshToken.update({
    where: { token },
    data: { revoked_at: new Date() },
  });
};

 const revokeAllUserRefreshTokens = async (userId: string) => {
  return prisma.refreshToken.updateMany({
    where: { user_id: userId, revoked_at: null },
    data: { revoked_at: new Date() },
  });
};

 const findUserByEmail = async (email: string) => {
  return prisma.user.findUnique({
    where: { email },
  });
};

 const findUserById = async (id: string) => {
  return prisma.user.findUnique({
    where: { id },
  });
 };

 const createUser = async (input: RegisterInput) => {
  return prisma.user.create({
    data: input,
  });
};

// ─── Email Verification ───
 export const authRepository = {
  saveRefreshToken,
  findRefreshToken,
  revokeRefreshToken,
  revokeAllUserRefreshTokens,
  findUserByEmail,
    findUserById,
  createUser
}