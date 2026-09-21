import { Router } from "express";
import authRoutes from "../modules/auth/auth.routes";
import corporateRoutes from "../modules/corporates/corporates.routes";
import programmeRoutes from "../modules/programmes/programmes.routes";
import formsRoutes from "../modules/forms/forms.routes";
import onboardingRoutes from "../modules/onboarding/onboarding.routes";
import dashboardRoutes from "../modules/dashboard/dashboard.routes";
import submissionRoutes from "../modules/submissions/submissions.routes";
import documentRoutes from "../modules/documents/documents.routes";
import exportRoutes from "../modules/exports/exports.routes";
import auditRoutes from "../modules/audit/audit.routes";
import userRoutes from "../modules/users/users.routes";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({ success: true, data: { status: "ok", time: new Date().toISOString() }, error: null });
});

router.use("/auth", authRoutes);
router.use("/corporates", corporateRoutes);
router.use("/programmes", programmeRoutes);
// Public onboarding MUST be registered before the root-level forms router,
// whose global requireAuth would otherwise intercept these public routes.
router.use("/onboarding", onboardingRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/submissions", submissionRoutes);
router.use("/documents", documentRoutes);
router.use("/exports", exportRoutes);
router.use("/audit-logs", auditRoutes);
router.use("/users", userRoutes);
// Standalone form-builder resources: /document-types, /sections/:id,
// /form-fields/:id, /programme-documents/:id, /onboarding-links/:linkId
router.use("/", formsRoutes);
// router.use("/exports", exportRoutes);

export default router;
