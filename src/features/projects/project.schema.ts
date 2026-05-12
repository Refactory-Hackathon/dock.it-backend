import z from "zod";

const nullableText = z
  .string()
  .trim()
  .optional()
  .nullable()
  .transform((value) => value || undefined);

export const projectIdentifierSchema = z.object({
  projectId: z.string().min(1),
});

export const createProjectSchema = z.object({
  name: z.string().trim().min(2),
  client: z.string().trim().min(2),
  industry: nullableText,
  type: z.string().trim().min(2),
  needs: z.string().trim().min(6),
  budget: nullableText,
  start: nullableText,
  deadline: nullableText,
  priority: z.enum(["Low", "Medium", "High"]).default("Medium"),
  docs: z.array(z.string().trim().min(1)).default([]),
  spaceId: nullableText,
  spaceName: nullableText,
  spaceColor: z.string().trim().optional().default("bg-indigo-500"),
});

export const saveMeetingSchema = z.object({
  title: z.string().trim().min(1).default("Kickoff meeting"),
  transcriptText: z.string().trim().min(1),
  startedAt: z.string().datetime().optional(),
  endedAt: z.string().datetime().optional(),
  lines: z
    .array(
      z.object({
        speaker: z.string().trim().min(1).default("Speaker"),
        text: z.string().trim().min(1),
        startedAtSeconds: z.number().int().min(0).default(0),
      }),
    )
    .default([]),
});

export const generateArtifactSchema = z.object({
  target: z.enum(["prd", "diagram", "documents", "stakeholders"]),
  revisionPrompt: z.string().trim().max(1200).optional(),
  transcriptText: z.string().trim().max(12000).optional(),
});

export const generateDocumentSchema = z.object({
  documentType: z.enum(["mom", "mou", "nda", "sow", "pks", "bast", "quotation", "prd"]),
  answers: z.record(z.string(), z.string()).default({}),
});

export const addStakeholderSchema = z.object({
  name: z.string().trim().min(2),
  email: z.string().email().optional().or(z.literal("")).transform((value) => value || undefined),
  organization: nullableText,
  position: nullableText,
  role: z.enum(["Owner", "Approver", "Reviewer", "Editor", "Viewer"]).default("Reviewer"),
});

export const signProjectDocumentSchema = z.object({
  documentId: z.string().uuid().optional(),
  signerName: z.string().trim().min(2),
  signerEmail: z.string().email().optional().or(z.literal("")).transform((value) => value || undefined),
  signatureDataUrl: z.string().trim().min(10).optional(),
});
