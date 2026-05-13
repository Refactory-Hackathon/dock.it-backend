import { Router } from "express";

import { optionalToken } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validate.middleware";
import { invitationController } from "./invitation.controller";
import { createInvitationSchema } from "./invitation.schema";

const router = Router();

router.use(optionalToken);

router.post("/", validate(createInvitationSchema), invitationController.createInvitation);
router.get("/:token/validate", invitationController.validateToken);
router.post("/:token/accept", invitationController.acceptInvitation);

export const invitationRoutes = router;
