import { Router } from "express";
import {
  updateSectionSchema,
  updateFieldSchema,
  updateProgrammeDocumentSchema,
  toggleOnboardingLinkSchema,
  idParamSchema,
} from "@mentor/shared";
import { z } from "zod";
import { validate } from "../../middleware/validate";
import { requireAuth, requireRole } from "../../middleware/auth";
import {
  updateSectionController,
  deleteSectionController,
  updateFieldController,
  deleteFieldController,
  updateDocConfigController,
  deleteDocConfigController,
  listDocumentTypesController,
} from "./forms.controller";
import { toggleLinkController } from "../programmes/programmes.controller";

const router = Router();
router.use(requireAuth);
const manager = requireRole("SUPER_ADMIN", "ADMIN");

// Document type catalogue (for the builder dropdowns)
router.get("/document-types", listDocumentTypesController);

// Sections
router.put("/sections/:id", manager, validate({ params: idParamSchema, body: updateSectionSchema }), updateSectionController);
router.delete("/sections/:id", manager, validate({ params: idParamSchema }), deleteSectionController);

// Fields
router.put("/form-fields/:id", manager, validate({ params: idParamSchema, body: updateFieldSchema }), updateFieldController);
router.delete("/form-fields/:id", manager, validate({ params: idParamSchema }), deleteFieldController);

// Programme documents
router.put("/programme-documents/:id", manager, validate({ params: idParamSchema, body: updateProgrammeDocumentSchema }), updateDocConfigController);
router.delete("/programme-documents/:id", manager, validate({ params: idParamSchema }), deleteDocConfigController);

// Onboarding link toggle
const linkParamSchema = z.object({ linkId: z.string().uuid() });
router.put("/onboarding-links/:linkId", manager, validate({ params: linkParamSchema, body: toggleOnboardingLinkSchema }), toggleLinkController);

export default router;
