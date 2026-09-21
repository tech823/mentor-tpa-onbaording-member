import type { Request, Response, NextFunction } from "express";
import { eq } from "drizzle-orm";
import { db } from "../db/index";
import { users, userCorporates } from "../db/schema/index";
import { verifyAccessToken } from "../utils/security";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import type { AuthUser, Role } from "@mentor/shared";

export const ACCESS_COOKIE = "mo_access";

/**
 * requireAuth — validates the JWT access cookie and loads the current user
 * (with their corporate scope) fresh from the DB so revoked access is honored.
 */
export const requireAuth = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  const token = req.cookies?.[ACCESS_COOKIE] ?? extractBearer(req);
  if (!token) throw ApiError.unauthorized("Authentication required");

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch {
    throw ApiError.unauthorized("Invalid or expired session");
  }

  const row = await db.query.users.findFirst({
    where: eq(users.id, payload.sub),
    columns: { id: true, email: true, fullName: true, role: true, isActive: true },
  });
  if (!row || !row.isActive) throw ApiError.unauthorized("Account not found or disabled");

  const corporateIds =
    row.role === "SUPER_ADMIN"
      ? []
      : (
          await db
            .select({ corporateId: userCorporates.corporateId })
            .from(userCorporates)
            .where(eq(userCorporates.userId, row.id))
        ).map((r) => r.corporateId);

  const authUser: AuthUser = {
    id: row.id,
    email: row.email,
    fullName: row.fullName,
    role: row.role,
    corporateIds,
  };
  req.user = authUser;
  next();
});

/** requireRole — restricts a route to one of the given roles (spec section 4). */
export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(ApiError.unauthorized());
    if (!roles.includes(req.user.role)) {
      return next(ApiError.forbidden("You do not have permission to perform this action"));
    }
    next();
  };
}

/**
 * assertCorporateAccess — tenant isolation guard (spec section 4/19).
 * SUPER_ADMIN sees all; others only their assigned corporates.
 */
export function assertCorporateAccess(user: AuthUser, corporateId: string) {
  if (user.role === "SUPER_ADMIN") return;
  if (!user.corporateIds.includes(corporateId)) {
    throw ApiError.forbidden("You do not have access to this corporate client's data");
  }
}

function extractBearer(req: Request): string | undefined {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) return header.slice(7);
  return undefined;
}
