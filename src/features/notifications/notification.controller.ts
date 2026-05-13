import { NextFunction, Request, Response } from "express";

import { APIResponse } from "../../utils/response.util";
import { notificationService } from "./notification.service";

type RequestWithUser = Request & {
  user?: { id: string; email: string };
};

const getNotifications = async (
  req: RequestWithUser,
  res: Response<APIResponse>,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      return res.status(401).json({ status: "error", message: "Unauthorized" });
    }

    const data = await notificationService.getUserNotifications(req.user.id);

    res.status(200).json({
      status: "success",
      message: "Notifications fetched",
      data,
    });
  } catch (error) {
    next(error);
  }
};

const markAsRead = async (
  req: RequestWithUser,
  res: Response<APIResponse>,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      return res.status(401).json({ status: "error", message: "Unauthorized" });
    }

    await notificationService.markRead(req.params.id);

    res.status(200).json({
      status: "success",
      message: "Notification marked as read",
    });
  } catch (error) {
    next(error);
  }
};

const markAllAsRead = async (
  req: RequestWithUser,
  res: Response<APIResponse>,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      return res.status(401).json({ status: "error", message: "Unauthorized" });
    }

    await notificationService.markAllRead(req.user.id);

    res.status(200).json({
      status: "success",
      message: "All notifications marked as read",
    });
  } catch (error) {
    next(error);
  }
};

export const notificationController = {
  getNotifications,
  markAsRead,
  markAllAsRead,
};
