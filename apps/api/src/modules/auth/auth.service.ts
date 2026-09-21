import { eq } from "drizzle-orm";
import { db } from "../../db/index";
import { users, userCorporates } from "../../db/schema/index";
import { verifyPassword, signAccessToken } from "../../utils/security";
import { ApiError } from "../../utils/ApiError";
import type { AuthUser, LoginInput } from "@mentor/shared";

export interface LoginResult {
  user: AuthUser;
  accessToken: string;
}

export async function login(input: LoginInput): Promise<LoginResult> {
  const user = await db.query.users.findFirst({
    where: eq(users.email, input.email),
  });

  // Constant-ish response: do not reveal whether the email exists.
  if (!user || !user.isActive) {
    throw ApiError.unauthorized("Invalid email or password");
  }

  const valid = await verifyPassword(input.password, user.passwordHash);
  if (!valid) throw ApiError.unauthorized("Invalid email or password");

  await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));

  const corporateIds =
    user.role === "SUPER_ADMIN"
      ? []
      : (
          await db
            .select({ corporateId: userCorporates.corporateId })
            .from(userCorporates)
            .where(eq(userCorporates.userId, user.id))
        ).map((r) => r.corporateId);

  const authUser: AuthUser = {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    corporateIds,
  };

  return { user: authUser, accessToken: signAccessToken({ sub: user.id, email: user.email, role: user.role }) };
}

export async function getMe(userId: string): Promise<AuthUser> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { id: true, email: true, fullName: true, role: true },
  });
  if (!user) throw ApiError.unauthorized();

  const corporateIds =
    user.role === "SUPER_ADMIN"
      ? []
      : (
          await db
            .select({ corporateId: userCorporates.corporateId })
            .from(userCorporates)
            .where(eq(userCorporates.userId, user.id))
        ).map((r) => r.corporateId);

  return { ...user, corporateIds };
}
