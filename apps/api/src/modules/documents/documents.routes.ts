import { Router } from "express";
import { verifyDocumentSchema, idParamSchema } from "@mentor/shared";
import { validate } from "../../middleware/validate";
import { requireAuth, requireRole } from "../../middleware/auth";
import { verifyController, downloadController } from "./documents.controller";

const router = Router();
router.use(requireAuth);

// Any authenticated user with tenant access can view the file (secure, not public).
router.get("/:id/download", validate({ params: idParamSchema }), downloadController);

// Only managers can verify/reject documents.
router.put(
  "/:id/verification",
  requireRole("SUPER_ADMIN", "ADMIN"),
  validate({ params: idParamSchema, body: verifyDocumentSchema }),
  verifyController
);

export default router;
