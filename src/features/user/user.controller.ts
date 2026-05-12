import { NextFunction, Request, Response } from "express";
import { APIResponse } from "../../utils/response.util";
import { userService } from "./user.service";

type RequestWithUser = Request & {
  user?: { id: string; email: string };
};

const getProfile = async (
  req: RequestWithUser,
  res: Response<APIResponse>,
  next: NextFunction,
) => {
  try {
    const data = await userService.getProfile(req.user!.id);

    res.status(200).json({
      status: "success",
      message: "Profile fetched successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (
  req: RequestWithUser,
  res: Response<APIResponse>,
  next: NextFunction,
) => {
  try {
    const data = await userService.updateProfile(req.user!.id, req.body);

    res.status(200).json({
      status: "success",
      message: "Profile updated successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const userController = {
  getProfile,
  updateProfile,
};
