import { Router } from "express";
import { validate } from "../../middleware/validate";
import { requireAuth, requireRole } from "../../middleware/auth";
import { listSubmissionsQuerySchema } from "../submissions/submissions.validators";
import { exportSubmissionsController } from "./exports.controller";

const router = Router();
router.use(requireAuth);

router.get(
  "/submissions",
  requireRole("SUPER_ADMIN", "ADMIN"),
  validate({ query: listSubmissionsQuerySchema }),
  exportSubmissionsController
);

export default router;
