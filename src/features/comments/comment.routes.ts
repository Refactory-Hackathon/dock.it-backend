import { Router } from "express";

import { optionalToken } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validate.middleware";
import { commentController } from "./comment.controller";
import { createCommentSchema } from "./comment.schema";

// Mounted under /api/projects/:projectId/artifacts/:artifactId/comments
const router = Router({ mergeParams: true });

router.use(optionalToken);

router.get("/", commentController.getComments);
router.post("/", validate(createCommentSchema), commentController.addComment);
router.delete("/:commentId", commentController.deleteComment);

export const commentRoutes = router;
