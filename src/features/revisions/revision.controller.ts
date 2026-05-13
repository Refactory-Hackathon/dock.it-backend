import { NextFunction, Request, Response } from "express";

import prisma from "../../lib/prisma";
import { APIResponse } from "../../utils/response.util";
import { revisionService } from "./revision.service";

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

const getRevisions = async (
  req: Request,
  res: Response<APIResponse>,
  next: NextFunction,
) => {
  try {
    const data = await revisionService.getRevisions(req.params.artifactId);
    res.status(200).json({
      status: "success",
      message: "Revisions fetched",
      data,
    });
  } catch (error) {
    next(error);
  }
};

const requestRevision = async (
  req: RequestWithUser,
  res: Response<APIResponse>,
  next: NextFunction,
) => {
  try {
    const { projectId: projectIdOrSlug, artifactId } = req.params;

    const project = await prisma.project.findFirst({
      where: buildProjectWhere(projectIdOrSlug),
      select: { id: true },
    });

    if (!project) {
      return res.status(404).json({ status: "error", message: "Project not found" });
    }

    const artifact = await prisma.generatedArtifact.findUnique({
      where: { id: artifactId },
      select: { active_version: true },
    });

    const requestedBy =
      req.body.requestedBy || req.user?.email || "Anonymous";

    const data = await revisionService.requestRevision({
      artifactId,
      projectId: project.id,
      version: req.body.version ?? artifact?.active_version ?? 1,
      requestedBy,
      assignedTo: req.body.assignedTo,
      notes: req.body.notes,
    });

    res.status(201).json({
      status: "success",
      message: "Revision requested",
      data,
    });
  } catch (error) {
    next(error);
  }
};

const resolveRevision = async (
  req: Request,
  res: Response<APIResponse>,
  next: NextFunction,
) => {
  try {
    const data = await revisionService.resolveRevision(req.params.revisionId);
    res.status(200).json({
      status: "success",
      message: "Revision resolved",
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const revisionController = {
  getRevisions,
  requestRevision,
  resolveRevision,
};
