import jwt, { SignOptions } from "jsonwebtoken";
import { envConfig } from "../config/env.config";

export interface TokenPayload {
  userId: string;
  iat?: number;
  exp?: number;
}

const accessTokenSecret = envConfig.ACCESS_TOKEN_SECRET;
const refreshTokenSecret = envConfig.REFRESH_TOKEN_SECRET;
const accessTokenExpiresIn =
  envConfig.ACCESS_TOKEN_EXPIRES_IN as SignOptions["expiresIn"];
const refreshTokenExpiresIn =
  envConfig.REFRESH_TOKEN_EXPIRES_IN as SignOptions["expiresIn"];

export function generateAccessToken(userId: string): string {
  const options: SignOptions = {
    expiresIn: accessTokenExpiresIn,
  };
  return jwt.sign({ userId }, accessTokenSecret, options);
}

export function generateRefreshToken(userId: string): string {
  const options: SignOptions = {
    expiresIn: refreshTokenExpiresIn,
  };
  return jwt.sign({ userId }, refreshTokenSecret, options);
}

export function verifyAccessToken(token: string): TokenPayload {
  const payload = jwt.verify(token, accessTokenSecret) as TokenPayload;
  return payload;
}

export function verifyRefreshToken(token: string): TokenPayload {
  const payload = jwt.verify(token, refreshTokenSecret) as TokenPayload;
  return payload;
}
