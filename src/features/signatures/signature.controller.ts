import { NextFunction, Request, Response } from "express";
import { APIResponse } from "../../utils/response.util";
import { signatureService } from "./signature.service";

type RequestWithUser = Request & {
  user?: { id: string; email: string };
};

const listSignatures = async (
  req: RequestWithUser,
  res: Response<APIResponse>,
  next: NextFunction,
) => {
  try {
    const data = await signatureService.listSignatures(req.user!.id);

    res.status(200).json({
      status: "success",
      message: "Signatures fetched successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

const createSignature = async (
  req: RequestWithUser,
  res: Response<APIResponse>,
  next: NextFunction,
) => {
  try {
    const data = await signatureService.createSignature(req.user!.id, req.body);

    res.status(201).json({
      status: "success",
      message: "Signature created successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

const deleteSignature = async (
  req: RequestWithUser,
  res: Response<APIResponse>,
  next: NextFunction,
) => {
  try {
    await signatureService.deleteSignature(req.user!.id, req.params.signatureId);

    res.status(200).json({
      status: "success",
      message: "Signature deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const signatureController = {
  listSignatures,
  createSignature,
  deleteSignature,
};
