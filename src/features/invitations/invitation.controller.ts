import { NextFunction, Request, Response } from "express";

import { APIResponse } from "../../utils/response.util";
import { invitationService } from "./invitation.service";

type RequestWithUser = Request & {
  user?: { id: string; email: string };
};

const createInvitation = async (
  req: RequestWithUser,
  res: Response<APIResponse>,
  next: NextFunction,
) => {
  try {
    const data = await invitationService.createInvitation({
      ...req.body,
      inviterName: req.body.inviterName || req.user?.email,
    });

    res.status(201).json({
      status: "success",
      message: "Invitation sent",
      data,
    });
  } catch (error) {
    next(error);
  }
};

const validateToken = async (
  req: Request,
  res: Response<APIResponse>,
  next: NextFunction,
) => {
  try {
    const data = await invitationService.validateToken(req.params.token);

    res.status(200).json({
      status: "success",
      message: "Invitation valid",
      data,
    });
  } catch (error) {
    next(error);
  }
};

const acceptInvitation = async (
  req: RequestWithUser,
  res: Response<APIResponse>,
  next: NextFunction,
) => {
  try {
    const data = await invitationService.acceptInvitation(
      req.params.token,
      req.user?.id,
    );

    res.status(200).json({
      status: "success",
      message: "Invitation accepted",
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const invitationController = {
  createInvitation,
  validateToken,
  acceptInvitation,
};
