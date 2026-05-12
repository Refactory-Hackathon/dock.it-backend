import { Router } from "express";

import { optionalToken } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validate.middleware";
import {
  createSpaceSchema,
  inviteMemberSchema,
  memberIdSchema,
  spaceIdSchema,
  updateMemberRoleSchema,
} from "./space.schema";
import { spaceController } from "./space.controller";

const router = Router();

router.use(optionalToken);

router.get("/", spaceController.listSpaces);
router.post("/", validate(createSpaceSchema), spaceController.createSpace);

router.get(
  "/:spaceId",
  validate(spaceIdSchema, "params"),
  spaceController.getSpace,
);

router.post(
  "/:spaceId/members",
  validate(spaceIdSchema, "params"),
  validate(inviteMemberSchema),
  spaceController.inviteMember,
);

router.patch(
  "/:spaceId/members/:memberId",
  validate(memberIdSchema, "params"),
  validate(updateMemberRoleSchema),
  spaceController.updateMemberRole,
);

router.delete(
  "/:spaceId/members/:memberId",
  validate(memberIdSchema, "params"),
  spaceController.removeMember,
);

export const spaceRoutes = router;
