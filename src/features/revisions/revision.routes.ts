import { Router } from "express";

import { optionalToken } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validate.middleware";
import { revisionController } from "./revision.controller";
import { createRevisionSchema } from "./revision.schema";

// Mounted under /api/projects/:projectId/artifacts/:artifactId/revisions
const artifactRouter = Router({ mergeParams: true });

artifactRouter.use(optionalToken);

artifactRouter.get("/", revisionController.getRevisions);
artifactRouter.post("/", validate(createRevisionSchema), revisionController.requestRevision);

export const revisionRoutes = artifactRouter;

// Resolve route: /api/projects/:projectId/revisions/:revisionId/resolve
const resolveRouter = Router({ mergeParams: true });
resolveRouter.use(optionalToken);
resolveRouter.patch("/:revisionId/resolve", revisionController.resolveRevision);

export const revisionResolveRoutes = resolveRouter;
