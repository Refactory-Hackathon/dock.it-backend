import { Router } from "express";
import { authController } from "./auth.controller";

import { verifyToken } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validate.middleware";
import { createUserSchema, loginUserSchema } from "./auth.schema";

const router = Router();

router.post(
  "/register",
  validate(createUserSchema, "body"),
  authController.createUser,
);

router.post(
  "/login",
  validate(loginUserSchema, "body"),
  authController.loginUser,
);

router.get("/me", verifyToken, authController.me);

router.post("/logout", verifyToken, authController.logoutUser);

// Email verification routes

export const authRoutes = router;