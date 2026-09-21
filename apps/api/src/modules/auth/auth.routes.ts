import { Router } from "express";
import { loginSchema } from "@mentor/shared";
import { validate } from "../../middleware/validate";
import { requireAuth } from "../../middleware/auth";
import { authLimiter } from "../../middleware/rateLimit";
import { loginController, logoutController, meController } from "./auth.controller";

const router = Router();

router.post("/login", authLimiter, validate({ body: loginSchema }), loginController);
router.post("/logout", logoutController);
router.get("/me", requireAuth, meController);

export default router;
