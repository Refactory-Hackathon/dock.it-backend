import { Router } from "express";

import { verifyToken } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validate.middleware";
import { userController } from "./user.controller";
import { updateProfileSchema } from "./user.schema";

const router = Router();

router.use(verifyToken);

router.get("/profile", userController.getProfile);
router.patch("/profile", validate(updateProfileSchema), userController.updateProfile);

export const userRoutes = router;
