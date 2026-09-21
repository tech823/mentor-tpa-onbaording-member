import { Router } from "express";
import {
  createProgrammeSchema,
  updateProgrammeSchema,
  createOnboardingLinkSchema,
  createSectionSchema,
  createFieldSchema,
  reorderSchema,
  createProgrammeDocumentSchema,
  idParamSchema,
} from "@mentor/shared";
import { validate } from "../../middleware/validate";
import { requireAuth, requireRole } from "../../middleware/auth";
import { listProgrammesQuerySchema } from "./programmes.validators";
import {
  listController,
  getController,
  createController,
  updateController,
  createLinkController,
} from "./programmes.controller";
import {
  getFormConfigController,
  createSectionController,
  createFieldController,
  reorderFieldsController,
  createDocConfigController,
} from "../forms/forms.controller";

const router = Router();
router.use(requireAuth);

const manager = requireRole("SUPER_ADMIN", "ADMIN");

// Programme CRUD
router.get("/", validate({ query: listProgrammesQuerySchema }), listController);
router.get("/:id", validate({ params: idParamSchema }), getController);
router.post("/", manager, validate({ body: createProgrammeSchema }), createController);
router.put("/:id", manager, validate({ params: idParamSchema, body: updateProgrammeSchema }), updateController);

// Onboarding link
router.post(
  "/:id/onboarding-link",
  manager,
  validate({ params: idParamSchema, body: createOnboardingLinkSchema }),
  createLinkController
);

// Form builder (nested under a programme)
router.get("/:id/form", validate({ params: idParamSchema }), getFormConfigController);
router.post("/:id/sections", manager, validate({ params: idParamSchema, body: createSectionSchema }), createSectionController);
router.post("/:id/form-fields", manager, validate({ params: idParamSchema, body: createFieldSchema }), createFieldController);
router.put("/:id/form-fields/reorder", manager, validate({ params: idParamSchema, body: reorderSchema }), reorderFieldsController);
router.post("/:id/documents", manager, validate({ params: idParamSchema, body: createProgrammeDocumentSchema }), createDocConfigController);

export default router;
