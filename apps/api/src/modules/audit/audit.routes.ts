import { Router } from "express";
import { z } from "zod";
import { paginationQuerySchema } from "@mentor/shared";
import { validate } from "../../middleware/validate";
import { requireAuth, requireRole } from "../../middleware/auth";
import { listAuditController } from "./audit.controller";

const router = Router();
router.use(requireAuth, requireRole("SUPER_ADMIN", "ADMIN"));

router.get("/", validate({ query: paginationQuerySchema.extend({ action: z.string().max(60).optional() }) }), listAuditController);

export default router;
