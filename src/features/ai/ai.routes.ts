import { Router } from "express";
import multer from "multer";

import { optionalToken } from "../../middleware/auth.middleware";
import { aiController } from "./ai.controller";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB max (Whisper limit)
});

const router = Router();

router.use(optionalToken);

router.post("/transcribe", upload.single("audio"), aiController.transcribe);

export const aiRoutes = router;
