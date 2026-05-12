import { NextFunction, Request, Response } from "express";
import { APIResponse } from "../utils/response.util";

export class APIError extends Error {
  statusCode: number | undefined;

  constructor(message: string, statusCode?: number) {
    super(message);
    this.statusCode = statusCode;
    this.name = this.constructor.name;
  }
}

export const errorHandler = (
  err: APIError,
  req: Request,
  res: Response<APIResponse>,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction,
) => {
  const rawStatusCode =
    (err as APIError & { status?: unknown }).statusCode ??
    (err as APIError & { status?: unknown }).status;
  const parsedStatusCode =
    typeof rawStatusCode === "string"
      ? Number.parseInt(rawStatusCode, 10)
      : rawStatusCode;
  const statusCode =
    typeof parsedStatusCode === "number" &&
    Number.isInteger(parsedStatusCode) &&
    parsedStatusCode >= 100 &&
    parsedStatusCode <= 599
      ? parsedStatusCode
      : err.name === "MulterError"
        ? 400
        : 500;

  // eslint-disable-next-line no-console
  console.error("[errorHandler]", {
    name: err.name,
    message: err.message,
    stack: err.stack,
  });

  res.status(statusCode).json({
    status: "error",
    message: err.message || "Internal Server Error",
  });
};