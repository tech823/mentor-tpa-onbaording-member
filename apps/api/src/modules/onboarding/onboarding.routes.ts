import { Router } from "express";
import multer from "multer";
import { z } from "zod";
import {
  startOnboardingSchema,
  saveMemberSchema,
  saveFamilyMemberSchema,
  submitOnboardingSchema,
} from "@mentor/shared";
import { validate } from "../../middleware/validate";
import { publicLimiter } from "../../middleware/rateLimit";
import { env } from "../../config/env";
import {
  configController,
  startController,
  resumeController,
  saveMemberController,
  addFamilyController,
  updateFamilyController,
  deleteFamilyController,
  uploadDocumentController,
  deleteDocumentController,
  submitController,
} from "./onboarding.controller";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.MAX_UPLOAD_BYTES, files: 1 },
});

const router = Router();

// All public onboarding endpoints are rate-limited (spec section 19).
router.use(publicLimiter);

const tokenParam = z.object({ token: z.string().min(20).max(64) });
const sessionParam = z.object({ sessionToken: z.string().min(20).max(64) });
const familyParam = sessionParam.extend({ familyId: z.string().uuid() });
const docParam = sessionParam.extend({ docId: z.string().uuid() });

// Public link (by onboarding-link token)
router.get("/link/:token/config", validate({ params: tokenParam }), configController);
router.post("/link/:token/start", validate({ params: tokenParam, body: startOnboardingSchema }), startController);

// Session-scoped (by session token)
router.get("/session/:sessionToken", validate({ params: sessionParam }), resumeController);
router.put("/session/:sessionToken/member", validate({ params: sessionParam, body: saveMemberSchema }), saveMemberController);
router.post("/session/:sessionToken/family", validate({ params: sessionParam, body: saveFamilyMemberSchema }), addFamilyController);
router.put("/session/:sessionToken/family/:familyId", validate({ params: familyParam, body: saveFamilyMemberSchema }), updateFamilyController);
router.delete("/session/:sessionToken/family/:familyId", validate({ params: familyParam }), deleteFamilyController);
router.post("/session/:sessionToken/documents", upload.single("file"), validate({ params: sessionParam }), uploadDocumentController);
router.delete("/session/:sessionToken/documents/:docId", validate({ params: docParam }), deleteDocumentController);
router.post("/session/:sessionToken/submit", validate({ params: sessionParam, body: submitOnboardingSchema }), submitController);

export default router;
