import { Router } from "express";

import { verifyToken } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validate.middleware";
import { signatureController } from "./signature.controller";
import { createSignatureSchema, signatureIdSchema } from "./signature.schema";

const router = Router();

router.use(verifyToken);

router.get("/", signatureController.listSignatures);
router.post("/", validate(createSignatureSchema), signatureController.createSignature);
router.delete(
  "/:signatureId",
  validate(signatureIdSchema, "params"),
  signatureController.deleteSignature,
);

export const signatureRoutes = router;
