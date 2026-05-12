import z from "zod";

export const updateProfileSchema = z.object({
  displayName: z.string().trim().min(2).max(100).optional(),
});
