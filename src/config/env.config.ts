import { APIError } from "../middleware/error.middleware";

const dotenv = require("dotenv");
dotenv.config();

const getEnvKey = (key: string, fallbackKey?: string) => {
  const value =
    process.env[key] ?? (fallbackKey ? process.env[fallbackKey] : undefined);

  if (!value) {
    const fallbackLabel = fallbackKey ? ` (or ${fallbackKey})` : "";
    throw new APIError(
      `Environment variable ${key}${fallbackLabel} is required but not set.`,
    );
  }

  return value;
};

const getOptionalEnvKey = (
  key: string,
  fallbackKey?: string,
  defaultValue?: string,
) => process.env[key] ?? (fallbackKey ? process.env[fallbackKey] : undefined) ?? defaultValue;

export const envConfig = {
  ACCESS_TOKEN_SECRET: getEnvKey("ACCESS_TOKEN_SECRET", "JWT_ACCESS_SECRET"),
  REFRESH_TOKEN_SECRET: getEnvKey("REFRESH_TOKEN_SECRET", "JWT_REFRESH_SECRET"),
  ACCESS_TOKEN_EXPIRES_IN: getOptionalEnvKey(
    "ACCESS_TOKEN_EXPIRES_IN",
    "JWT_ACCESS_EXPIRY",
    "15m",
  ),
  REFRESH_TOKEN_EXPIRES_IN: getOptionalEnvKey(
    "REFRESH_TOKEN_EXPIRES_IN",
    "JWT_REFRESH_EXPIRY",
    "7d",
  ),
  DATABASE_URL: getEnvKey("DATABASE_URL"),
  PORT: getOptionalEnvKey("PORT", undefined, "3001"),
  GEMINI_API_KEY: getOptionalEnvKey("GEMINI_API_KEY"),
  GEMINI_MODEL: getOptionalEnvKey("GEMINI_MODEL", undefined, "gemini-2.5-flash"),
  CORS_ORIGIN: getOptionalEnvKey(
    "CORS_ORIGIN",
    "FRONTEND_URL",
    "http://localhost:3000,http://127.0.0.1:3000",
  ),
};
