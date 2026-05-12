import bcrypt from "bcrypt";
import { APIError } from "../../middleware/error.middleware";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../../utils/token.util";
import { authRepository } from "./auth.repository";
import type { RegisterInput, LoginInput } from "./auth.types";

const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

const issueTokensForUser = async (userId: string, email: string) => {
  const payload = { userId, email };

  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  await authRepository.revokeAllUserRefreshTokens(userId);
  await authRepository.saveRefreshToken(
    userId,
    refreshToken,
    new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
  );

  return { accessToken, refreshToken };
};

const createUser = async (input: RegisterInput) => {
  const { email, password } = input;

  const existing = await authRepository.findUserByEmail(email);

  if (existing) {
    throw new APIError("User with this email already exists", 400);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await authRepository.createUser({
    email,
    password: hashedPassword,
  });

  const tokens = await issueTokensForUser(user.id, user.email);

  const { password: _pw, ...safeUser } = user;

  return {
    user: safeUser,
    ...tokens,
  };
};

const loginUser = async (input: LoginInput) => {
  const { email, password } = input;

  const user = await authRepository.findUserByEmail(email);

  if (!user) {
    throw new APIError("Invalid email or password", 401);
  }

  const isValid = await bcrypt.compare(password, user.password);

  if (!isValid) {
    throw new APIError("Invalid email or password", 401);
  }

  const tokens = await issueTokensForUser(user.id, user.email);

  const { password: _pw, ...safeUser } = user;

  return {
    user: safeUser,
    ...tokens,
  };
};

export const authService = {
  createUser,
  loginUser,
};