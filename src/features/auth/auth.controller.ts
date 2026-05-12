import { NextFunction, Request, Response } from "express";
import { APIResponse } from "../../utils/response.util";
import z from "zod";
import { createUserSchema, loginUserSchema } from "./auth.schema";
import { clearAuthCookies, setAuthCookies } from "../../utils/token.util";
import { authService } from "./auth.service";
import { authRepository } from "./auth.repository";

type RequestWithUser = Request & {
  user?: {
    id: string;
    email: string;
  };
};

const createUser = async (
  req: Request,
  res: Response<APIResponse>,
  next: NextFunction,
) => {
  try {
    const { email, password } = req.body as z.infer<
      typeof createUserSchema
    >;

    const { accessToken, refreshToken, user } = await authService.createUser({
      email,
      password,
    });

    setAuthCookies(res, accessToken, refreshToken);

    res.status(201).json({
      status: "success",
      message: "User registered successfully",
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

const logoutUser = async (
  req: Request,
  res: Response<APIResponse>,
  next: NextFunction,
) => {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (refreshToken) {
      await authRepository
        .revokeRefreshToken(refreshToken)
        .catch(() => undefined);
    }

    clearAuthCookies(res);

    res.status(200).json({
      status: "success",
      message: "Logged out successfully",
    });
  } catch (error) {
    next(error);
  }
};

const loginUser = async (
  req: Request,
  res: Response<APIResponse>,
  next: NextFunction,
) => {
  try {
    const { email, password } = req.body as z.infer<typeof loginUserSchema>;

    const { accessToken, refreshToken, user } = await authService.loginUser({
      email,
      password,
    });

    setAuthCookies(res, accessToken, refreshToken);

    res.status(200).json({
      status: "success",
      message: "Logged in successfully",
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

const me = async (
  req: RequestWithUser,
  res: Response<APIResponse>,
  next: NextFunction,
) => {
  try {
    res.status(200).json({
      status: "success",
      message: "Current user",
      data: { user: req.user },
    });
  } catch (error) {
    next(error);
  }
};

export const authController = {
  createUser,
  logoutUser,
  loginUser,
  me,
};