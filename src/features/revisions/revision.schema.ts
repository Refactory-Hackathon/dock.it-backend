import z from "zod";

export const createRevisionSchema = z.object({
  notes: z.string().trim().min(1, "Catatan revisi tidak boleh kosong").max(5000),
  version: z.number().int().nonnegative().optional(),
  requestedBy: z.string().trim().optional(),
  assignedTo: z.string().trim().optional(),
});

export const revisionIdSchema = z.object({
  revisionId: z.string().uuid(),
});
