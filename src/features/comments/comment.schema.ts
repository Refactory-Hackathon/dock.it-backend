import z from "zod";

export const artifactIdSchema = z.object({
  projectId: z.string(),
  artifactId: z.string().uuid("Invalid artifact ID"),
});

export const createCommentSchema = z.object({
  content: z.string().trim().min(1, "Komentar tidak boleh kosong").max(5000),
  parentId: z.string().uuid().optional(),
  userName: z.string().trim().min(1).optional(),
});

export const commentIdSchema = z.object({
  commentId: z.string().uuid(),
});
