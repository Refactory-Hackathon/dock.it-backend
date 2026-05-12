import { NextFunction, Request, Response } from "express";
import { APIResponse } from "../../utils/response.util";
import { transcribeAudio } from "./ai.service";

const transcribe = async (
  req: Request,
  res: Response<APIResponse>,
  next: NextFunction,
) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        status: "error",
        message: "Audio file is required.",
      });
    }

    const language = "id";
    const transcript = await transcribeAudio(
      file.buffer,
      file.originalname || "audio.webm",
      language,
    );

    res.status(200).json({
      status: "success",
      message: "Audio transcribed successfully",
      data: { transcript },
    });
  } catch (error) {
    next(error);
  }
};

export const aiController = {
  transcribe,
};
