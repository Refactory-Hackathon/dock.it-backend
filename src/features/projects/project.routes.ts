import { Router } from "express";

import { optionalToken } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validate.middleware";
import { projectController } from "./project.controller";
import {
  addStakeholderSchema,
  createProjectSchema,
  generateArtifactSchema,
  generateDocumentSchema,
  projectIdentifierSchema,
  saveMeetingSchema,
  signProjectDocumentSchema,
} from "./project.schema";

const router = Router();

router.use(optionalToken);

router.get("/", projectController.listProjects);
router.post("/", validate(createProjectSchema), projectController.createProject);

router.get(
  "/:projectId",
  validate(projectIdentifierSchema, "params"),
  projectController.getProject,
);

router.post(
  "/:projectId/meetings",
  validate(projectIdentifierSchema, "params"),
  validate(saveMeetingSchema),
  projectController.saveMeeting,
);

router.post(
  "/:projectId/generate",
  validate(projectIdentifierSchema, "params"),
  validate(generateArtifactSchema),
  projectController.generateArtifact,
);

router.post(
  "/:projectId/documents",
  validate(projectIdentifierSchema, "params"),
  validate(generateDocumentSchema),
  projectController.generateDocument,
);

router.post(
  "/:projectId/stakeholders",
  validate(projectIdentifierSchema, "params"),
  validate(addStakeholderSchema),
  projectController.addStakeholder,
);

router.post(
  "/:projectId/signatures",
  validate(projectIdentifierSchema, "params"),
  validate(signProjectDocumentSchema),
  projectController.signDocument,
);

router.post(
  "/:projectId/notify-client",
  validate(projectIdentifierSchema, "params"),
  projectController.notifyClient,
);

router.patch(
  "/:projectId/artifacts/:artifactId/approve",
  projectController.approveArtifact,
);

export const projectRoutes = router;
