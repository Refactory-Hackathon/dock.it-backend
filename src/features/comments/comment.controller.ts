import { NextFunction, Request, Response } from "express";

import { APIResponse } from "../../utils/response.util";
import { commentService } from "./comment.service";

type RequestWithUser = Request & {
  user?: { id: string; email: string };
};

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function buildProjectWhere(identifier: string) {
  if (UUID_REGEX.test(identifier)) {
    return { OR: [{ id: identifier }, { slug: identifier }] };
  }
  return { slug: identifier };
}

const getComments = async (
  req: Request,
  res: Response<APIResponse>,
  next: NextFunction,
) => {
  try {
    const data = await commentService.getComments(req.params.artifactId);
    res.status(200).json({
      status: "success",
      message: "Comments fetched",
      data,
    });
  } catch (error) {
    next(error);
  }
};

const addComment = async (
  req: RequestWithUser,
  res: Response<APIResponse>,
  next: NextFunction,
) => {
  try {
    // Resolve project by slug or UUID
    const { projectId: projectIdOrSlug, artifactId } = req.params;

    // projectId param could be a slug; resolve to UUID via prisma
    const prisma = (await import("../../lib/prisma")).default;
    const project = await prisma.project.findFirst({
      where: buildProjectWhere(projectIdOrSlug),
      select: { id: true },
    });

    if (!project) {
      return res.status(404).json({ status: "error", message: "Project not found" });
    }

    const userName = req.body.userName || req.user?.email || "Anonymous";

    const data = await commentService.addComment({
      artifactId,
      projectId: project.id,
      userId: req.user?.id,
      userName,
      content: req.body.content,
      parentId: req.body.parentId,
    });

    res.status(201).json({
      status: "success",
      message: "Comment added",
      data,
    });
  } catch (error) {
    next(error);
  }
};

const deleteComment = async (
  req: Request,
  res: Response<APIResponse>,
  next: NextFunction,
) => {
  try {
    await commentService.deleteComment(req.params.commentId);
    res.status(200).json({
      status: "success",
      message: "Comment deleted",
    });
  } catch (error) {
    next(error);
  }
};

export const commentController = {
  getComments,
  addComment,
  deleteComment,
};
