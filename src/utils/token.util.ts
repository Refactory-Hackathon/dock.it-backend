// src/utils/token.util.ts
import dotenv from "dotenv";
dotenv.config();

import jwt from "jsonwebtoken";
import { CookieOptions, Response } from "express";

import { SignOptions } from "jsonwebtoken";
import { envConfig  } from "../config/env.config";

export const jwtConfig = {
  accessTokenSecret: envConfig.ACCESS_TOKEN_SECRET,
  refreshTokenSecret: envConfig.REFRESH_TOKEN_SECRET,

  accessTokenExpiresIn: "15m" as SignOptions["expiresIn"],
  refreshTokenExpiresIn: "7d" as SignOptions["expiresIn"],
};

export interface JwtPayload {
  userId: string;
  email: string;
}

export const generateAccessToken = (payload: JwtPayload): string =>
  jwt.sign(payload, jwtConfig.accessTokenSecret, {
    expiresIn: jwtConfig.accessTokenExpiresIn,
  });

export const generateRefreshToken = (payload: JwtPayload): string =>
  jwt.sign(payload, jwtConfig.refreshTokenSecret, {
    expiresIn: jwtConfig.refreshTokenExpiresIn,
  });

export const verifyRefreshToken = (token: string): JwtPayload =>
  jwt.verify(token, jwtConfig.refreshTokenSecret) as JwtPayload;

export const verifyAccessToken = (token: string): JwtPayload =>
  jwt.verify(token, jwtConfig.accessTokenSecret) as JwtPayload;

const buildAuthCookieOptions = (): CookieOptions => {
  const sameSite: CookieOptions["sameSite"] =
    process.env.NODE_ENV === "production" ? "none" : "lax";

  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite,
    path: "/",
  };
};

export const setAccessTokenCookie = (res: Response, accessToken: string) => {
  const accessTokenMaxAge = 15 * 60 * 1000;

  res.cookie("accessToken", accessToken, {
    ...buildAuthCookieOptions(),
    maxAge: accessTokenMaxAge,
  });
};

export const setAuthCookies = (
  res: Response,
  accessToken: string,
  refreshToken: string,
) => {
  const refreshTokenMaxAge = 7 * 24 * 60 * 60 * 1000;
  setAccessTokenCookie(res, accessToken);

  // Refresh token: longer-lived (~7d)
  res.cookie("refreshToken", refreshToken, {
    ...buildAuthCookieOptions(),
    maxAge: refreshTokenMaxAge,
  });
};

export const clearAuthCookies = (res: Response) => {
  res.clearCookie("accessToken", {
    ...buildAuthCookieOptions(),
  });

  res.clearCookie("refreshToken", {
    ...buildAuthCookieOptions(),
  });
};