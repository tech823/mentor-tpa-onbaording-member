import { Router } from "express";
import { updateSubmissionStatusSchema, idParamSchema } from "@mentor/shared";
import { validate } from "../../middleware/validate";
import { requireAuth, requireRole } from "../../middleware/auth";
import { listSubmissionsQuerySchema } from "./submissions.validators";
import { listController, getController, updateStatusController } from "./submissions.controller";

const router = Router();
router.use(requireAuth);

router.get("/", validate({ query: listSubmissionsQuerySchema }), listController);
router.get("/:id", validate({ params: idParamSchema }), getController);
router.put(
  "/:id/status",
  requireRole("SUPER_ADMIN", "ADMIN"),
  validate({ params: idParamSchema, body: updateSubmissionStatusSchema }),
  updateStatusController
);

export default router;
