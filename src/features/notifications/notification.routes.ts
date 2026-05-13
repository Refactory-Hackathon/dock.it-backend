import { Router } from "express";

import { verifyToken } from "../../middleware/auth.middleware";
import { notificationController } from "./notification.controller";

const router = Router();

router.use(verifyToken);

router.get("/", notificationController.getNotifications);
router.patch("/:id/read", notificationController.markAsRead);
router.patch("/read-all", notificationController.markAllAsRead);

export const notificationRoutes = router;
