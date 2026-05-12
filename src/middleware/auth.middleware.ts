import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";


import { APIResponse } from "../utils/response.util";
import {
  generateAccessToken,
  setAccessTokenCookie,
  verifyAccessToken,
  verifyRefreshToken,
} from "../utils/token.util";
import { APIError } from "./error.middleware";
// import { authRepository } from "../features/auth/auth.repository";
import {authRepository} from '../features/auth/auth.repository';

type RequestWithUser = Request & {
  user?: {
    id: string;
    email: string;
  };
};

export const verifyToken = async (
  req: RequestWithUser,
  res: Response<APIResponse>,
  next: NextFunction,
) => {
  try {
    const accessToken =
      req.cookies?.accessToken ??
      (req.headers.authorization?.startsWith("Bearer ")
        ? req.headers.authorization.slice(7)
        : undefined);

    if (accessToken) {
      try {
        const accessPayload = verifyAccessToken(accessToken);

        const user = await authRepository.findUserById(
          accessPayload.userId,
        );

        if (!user) {
          throw new APIError("Unauthorized", 401);
        }

        req.user = { id: user.id, email: user.email };
        return next();
      } catch (error) {
        if (error instanceof APIError) {
          throw error;
        }

        if (
          !(error instanceof jwt.TokenExpiredError) &&
          !(error instanceof jwt.JsonWebTokenError)
        ) {
          throw error;
        }
      }
    }

    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      throw new APIError("Unauthorized", 401);
    }

    const refreshPayload = verifyRefreshToken(refreshToken);
    const storedToken = await authRepository.findRefreshToken(refreshToken);

    if (
      !storedToken ||
      storedToken.revoked_at !== null ||
      storedToken.expires_at <= new Date()
    ) {
      throw new APIError("Unauthorized", 401);
    }

    const newAccessToken = generateAccessToken({
      userId: refreshPayload.userId,
      email: refreshPayload.email,
    });

    setAccessTokenCookie(res, newAccessToken);

    const user = await authRepository.findUserById(refreshPayload.userId);

    if (!user) {
      throw new APIError("Unauthorized", 401);
    }

    req.user = { id: user.id, email: user.email };
    return next();
  } catch (error) {
    if (error instanceof APIError) {
      return next(error);
    }

    if (
      error instanceof jwt.JsonWebTokenError ||
      error instanceof jwt.TokenExpiredError
    ) {
      return next(new APIError("Unauthorized", 401));
    }

    console.error("Verify token error:", error);

    return next(new APIError("Authentication failed", 500));
  }
};