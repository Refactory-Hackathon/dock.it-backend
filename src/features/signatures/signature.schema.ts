import z from "zod";

export const createSignatureSchema = z.object({
  name: z.string().trim().min(1, "Signature name is required"),
  dataUrl: z.string().trim().min(10, "Signature data is required"),
});

export const signatureIdSchema = z.object({
  signatureId: z.string().uuid("Invalid signature ID"),
});
