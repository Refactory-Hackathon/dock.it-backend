import z from "zod";

export const createInvitationSchema = z.object({
  spaceId: z.string().uuid("Invalid space ID").optional().or(z.literal("")),
  projectId: z.string().optional().or(z.literal("")),
  email: z.string().email("Invalid email"),
  name: z.string().trim().min(2),
  role: z.enum(["Viewer", "Reviewer", "Editor", "Approver"]).default("Viewer"),
  inviterName: z.string().trim().optional(),
});

export const tokenParamSchema = z.object({
  token: z.string().min(10),
});
