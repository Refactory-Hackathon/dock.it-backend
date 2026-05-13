import { NextFunction, Request, Response } from "express";

import { APIResponse } from "../../utils/response.util";
import { spaceService } from "./space.service";

type RequestWithUser = Request & {
  user?: {
    id: string;
    email: string;
  };
};

const listSpaces = async (
  req: Request,
  res: Response<APIResponse>,
  next: NextFunction,
) => {
  try {
    const userId = (req as RequestWithUser).user?.id;
    const data = await spaceService.listSpaces(userId);

    res.status(200).json({
      status: "success",
      message: "Spaces fetched successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

const getSpace = async (
  req: Request,
  res: Response<APIResponse>,
  next: NextFunction,
) => {
  try {
    const data = await spaceService.getSpace(req.params.spaceId);

    res.status(200).json({
      status: "success",
      message: "Space fetched successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

const createSpace = async (
  req: RequestWithUser,
  res: Response<APIResponse>,
  next: NextFunction,
) => {
  try {
    const data = await spaceService.createSpace({
      ...req.body,
      ownerId: req.user?.id,
    });

    res.status(201).json({
      status: "success",
      message: "Space created successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

const inviteMember = async (
  req: Request,
  res: Response<APIResponse>,
  next: NextFunction,
) => {
  try {
    const data = await spaceService.inviteMember(req.params.spaceId, req.body);

    res.status(201).json({
      status: "success",
      message: "Member invited successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

const updateMemberRole = async (
  req: Request,
  res: Response<APIResponse>,
  next: NextFunction,
) => {
  try {
    const data = await spaceService.updateMemberRole(
      req.params.memberId,
      req.body.role,
    );

    res.status(200).json({
      status: "success",
      message: "Member role updated successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

const removeMember = async (
  req: Request,
  res: Response<APIResponse>,
  next: NextFunction,
) => {
  try {
    await spaceService.removeMember(req.params.memberId);

    res.status(200).json({
      status: "success",
      message: "Member removed successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const spaceController = {
  listSpaces,
  getSpace,
  createSpace,
  inviteMember,
  updateMemberRole,
  removeMember,
};
