import { NextFunction, Request, Response } from "express";

import { APIResponse } from "../../utils/response.util";
import { projectService } from "./project.service";
import { notifyClientService } from "./notify-client.service";
import type { RequestUser } from "./project.types";

type RequestWithUser = Request & {
  user?: RequestUser;
};

const listProjects = async (
  req: Request,
  res: Response<APIResponse>,
  next: NextFunction,
) => {
  try {
    const userId = (req as RequestWithUser).user?.id;
    const data = await projectService.listProjects(userId);

    res.status(200).json({
      status: "success",
      message: "Projects fetched successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

const getProject = async (
  req: Request,
  res: Response<APIResponse>,
  next: NextFunction,
) => {
  try {
    const data = await projectService.getProject(req.params.projectId);

    res.status(200).json({
      status: "success",
      message: "Project fetched successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

const createProject = async (
  req: RequestWithUser,
  res: Response<APIResponse>,
  next: NextFunction,
) => {
  try {
    const data = await projectService.createProject(req.body, req.user?.id);

    res.status(201).json({
      status: "success",
      message: "Project created successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

const saveMeeting = async (
  req: Request,
  res: Response<APIResponse>,
  next: NextFunction,
) => {
  try {
    const data = await projectService.saveMeeting(req.params.projectId, req.body);

    res.status(201).json({
      status: "success",
      message: "Meeting transcript saved successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

const generateArtifact = async (
  req: Request,
  res: Response<APIResponse>,
  next: NextFunction,
) => {
  try {
    const data = await projectService.generateArtifact(
      req.params.projectId,
      req.body,
    );

    res.status(201).json({
      status: "success",
      message: "Artifact generated successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

const generateDocument = async (
  req: Request,
  res: Response<APIResponse>,
  next: NextFunction,
) => {
  try {
    const data = await projectService.generateDocument(
      req.params.projectId,
      req.body,
    );

    res.status(201).json({
      status: "success",
      message: "Document generated successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

const addStakeholder = async (
  req: Request,
  res: Response<APIResponse>,
  next: NextFunction,
) => {
  try {
    const data = await projectService.addStakeholder(
      req.params.projectId,
      req.body,
    );

    res.status(201).json({
      status: "success",
      message: "Stakeholder added successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

const signDocument = async (
  req: Request,
  res: Response<APIResponse>,
  next: NextFunction,
) => {
  try {
    const data = await projectService.signDocument(req.params.projectId, req.body);

    res.status(201).json({
      status: "success",
      message: "Document signed successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

const notifyClient = async (
  req: RequestWithUser,
  res: Response<APIResponse>,
  next: NextFunction,
) => {
  try {
    const data = await notifyClientService.notifyClient({
      projectIdentifier: req.params.projectId,
      message: req.body?.message,
      senderName: req.user?.email,
    });

    res.status(200).json({
      status: "success",
      message: "Notification sent to stakeholders",
      data,
    });
  } catch (error) {
    next(error);
  }
};

const approveArtifact = async (
  req: RequestWithUser,
  res: Response<APIResponse>,
  next: NextFunction,
) => {
  try {
    const { projectService: ps } = await import("./project.service");
    const { projectRepository: repo } = await import("./project.repository");

    const artifact = await repo.updateArtifactStatus(req.params.artifactId, "APPROVED");

    res.status(200).json({
      status: "success",
      message: "Artifact approved",
      data: { artifact },
    });
  } catch (error) {
    next(error);
  }
};

export const projectController = {
  listProjects,
  getProject,
  createProject,
  saveMeeting,
  generateArtifact,
  generateDocument,
  addStakeholder,
  signDocument,
  notifyClient,
  approveArtifact,
};
