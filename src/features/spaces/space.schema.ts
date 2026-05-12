import z from "zod";

export const createSpaceSchema = z.object({
  name: z.string().trim().min(2),
  color: z.string().trim().default("bg-indigo-500"),
});

export const spaceIdSchema = z.object({
  spaceId: z.string().uuid("Invalid space ID"),
});

export const inviteMemberSchema = z.object({
  name: z.string().trim().min(2),
  email: z.string().email().optional().or(z.literal("")).transform((v) => v || undefined),
  role: z.enum(["Viewer", "Reviewer", "Editor", "Approver"]).default("Viewer"),
  position: z.string().trim().optional(),
});

export const updateMemberRoleSchema = z.object({
  role: z.enum(["Viewer", "Reviewer", "Editor", "Approver"]),
});

export const memberIdSchema = z.object({
  spaceId: z.string().uuid(),
  memberId: z.string().uuid(),
});
