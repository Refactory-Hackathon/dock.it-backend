import type z from "zod";

import type {
  addStakeholderSchema,
  createProjectSchema,
  generateArtifactSchema,
  generateDocumentSchema,
  saveMeetingSchema,
  signProjectDocumentSchema,
} from "./project.schema";

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type SaveMeetingInput = z.infer<typeof saveMeetingSchema>;
export type GenerateArtifactInput = z.infer<typeof generateArtifactSchema>;
export type GenerateDocumentInput = z.infer<typeof generateDocumentSchema>;
export type AddStakeholderInput = z.infer<typeof addStakeholderSchema>;
export type SignProjectDocumentInput = z.infer<typeof signProjectDocumentSchema>;

export type RequestUser = {
  id: string;
  email: string;
};
