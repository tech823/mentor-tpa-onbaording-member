import { Router } from "express";
import { desc, eq } from "drizzle-orm";
import { db } from "../../db/index";
import { users, userCorporates } from "../../db/schema/index";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok, created } from "../../utils/apiResponse";
import { ApiError } from "../../utils/ApiError";
import { hashPassword } from "../../utils/security";
import { requireAuth, requireRole } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { recordAudit } from "../audit/audit.service";
import { createUserSchema, toggleUserActiveSchema, idParamSchema, type CreateUserInput, type ToggleUserActiveInput } from "@mentor/shared";

const router = Router();
router.use(requireAuth, requireRole("SUPER_ADMIN"));

const publicCols = {
  id: users.id,
  email: users.email,
  fullName: users.fullName,
  role: users.role,
  isActive: users.isActive,
  lastLoginAt: users.lastLoginAt,
  createdAt: users.createdAt,
};

// List
router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const rows = await db.select(publicCols).from(users).orderBy(desc(users.createdAt));
    return ok(res, rows);
  })
);

// Create
router.post(
  "/",
  validate({ body: createUserSchema }),
  asyncHandler(async (req, res) => {
    const input = req.body as CreateUserInput;
    const existing = await db.query.users.findFirst({ where: eq(users.email, input.email) });
    if (existing) throw ApiError.conflict("A user with this email already exists");

    const passwordHash = await hashPassword(input.password);
    const [user] = await db
      .insert(users)
      .values({ email: input.email, fullName: input.fullName, role: input.role, passwordHash })
      .returning(publicCols);

    if (input.role !== "SUPER_ADMIN" && input.corporateIds.length && user) {
      await db.insert(userCorporates).values(input.corporateIds.map((corporateId) => ({ userId: user.id, corporateId })));
    }
    await recordAudit(req, req.user, { action: "USER_CREATED", entityType: "user", entityId: user?.id, metadata: { role: input.role } });
    return created(res, user);
  })
);

// Toggle active / disable
router.put(
  "/:id/active",
  validate({ params: idParamSchema, body: toggleUserActiveSchema }),
  asyncHandler(async (req, res) => {
    const { isActive } = req.body as ToggleUserActiveInput;
    if (req.params.id === req.user!.id) throw ApiError.badRequest("You cannot disable your own account");
    const [user] = await db
      .update(users)
      .set({ isActive, updatedAt: new Date() })
      .where(eq(users.id, req.params.id!))
      .returning(publicCols);
    if (!user) throw ApiError.notFound("User not found");
    await recordAudit(req, req.user, { action: "USER_UPDATED", entityType: "user", entityId: user.id, metadata: { isActive } });
    return ok(res, user);
  })
);

export default router;
