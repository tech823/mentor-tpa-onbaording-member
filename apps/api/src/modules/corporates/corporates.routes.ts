import { Router } from "express";
import { createCorporateSchema, updateCorporateSchema, idParamSchema } from "@mentor/shared";
import { validate } from "../../middleware/validate";
import { requireAuth, requireRole } from "../../middleware/auth";
import { listCorporatesQuerySchema } from "./corporates.validators";
import {
  listController,
  getController,
  createController,
  updateController,
} from "./corporates.controller";

const router = Router();

router.use(requireAuth);

router.get("/", validate({ query: listCorporatesQuerySchema }), listController);
router.get("/:id", validate({ params: idParamSchema }), getController);

// Only SUPER_ADMIN and ADMIN may create/modify corporates (spec section 4).
router.post(
  "/",
  requireRole("SUPER_ADMIN", "ADMIN"),
  validate({ body: createCorporateSchema }),
  createController
);
router.put(
  "/:id",
  requireRole("SUPER_ADMIN", "ADMIN"),
  validate({ params: idParamSchema, body: updateCorporateSchema }),
  updateController
);

export default router;
