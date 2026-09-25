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
import {
  createUserSchema,
  updateUserSchema,
  toggleUserActiveSchema,
  idParamSchema,
  type CreateUserInput,
  type UpdateUserInput,
  type ToggleUserActiveInput,
} from "@mentor/shared";

const router = Router();
// User management (list / create / edit role / enable-disable) is limited to
// SUPER_ADMIN and ADMIN only — CORPORATE_ADMIN and others get 403.
router.use(requireAuth, requireRole("SUPER_ADMIN", "ADMIN"));

const publicCols = {
  id: users.id,
  email: users.email,
  fullName: users.fullName,
  role: users.role,
  isActive: users.isActive,
  lastLoginAt: users.lastLoginAt,
  createdAt: users.createdAt,
};

// List (with each user's assigned corporate ids, for the edit dialog)
router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const rows = await db.select(publicCols).from(users).orderBy(desc(users.createdAt));
    const links = await db
      .select({ userId: userCorporates.userId, corporateId: userCorporates.corporateId })
      .from(userCorporates);
    const byUser = new Map<string, string[]>();
    for (const l of links) {
      const arr = byUser.get(l.userId) ?? [];
      arr.push(l.corporateId);
      byUser.set(l.userId, arr);
    }
    return ok(res, rows.map((r) => ({ ...r, corporateIds: byUser.get(r.id) ?? [] })));
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

// Edit — change name, role and corporate access. Role change takes effect on the
// user's very next request (requireAuth re-reads the role fresh from the DB).
router.put(
  "/:id",
  validate({ params: idParamSchema, body: updateUserSchema }),
  asyncHandler(async (req, res) => {
    const input = req.body as UpdateUserInput;
    const id = req.params.id!;
    const existing = await db.query.users.findFirst({ where: eq(users.id, id) });
    if (!existing) throw ApiError.notFound("User not found");
    if (id === req.user!.id && input.role !== existing.role) {
      throw ApiError.badRequest("You cannot change your own role");
    }

    const [user] = await db
      .update(users)
      .set({ fullName: input.fullName, role: input.role, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning(publicCols);

    // Rebuild corporate access: SUPER_ADMIN has implicit access to all (no rows).
    await db.delete(userCorporates).where(eq(userCorporates.userId, id));
    if (input.role !== "SUPER_ADMIN" && input.corporateIds.length) {
      await db.insert(userCorporates).values(input.corporateIds.map((corporateId) => ({ userId: id, corporateId })));
    }

    await recordAudit(req, req.user, {
      action: "USER_UPDATED",
      entityType: "user",
      entityId: id,
      metadata: { role: input.role },
    });
    return ok(res, user);
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
