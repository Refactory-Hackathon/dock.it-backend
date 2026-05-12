import type z from "zod";
import type { createSignatureSchema } from "./signature.schema";

export type CreateSignatureInput = z.infer<typeof createSignatureSchema>;
