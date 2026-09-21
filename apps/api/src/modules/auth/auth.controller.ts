import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok } from "../../utils/apiResponse";
import { ApiError } from "../../utils/ApiError";
import { ACCESS_COOKIE } from "../../middleware/auth";
import { env, isProd } from "../../config/env";
import { recordAudit } from "../audit/audit.service";
import * as authService from "./auth.service";
import type { LoginInput } from "@mentor/shared";

const cookieOptions = () => ({
  httpOnly: true,
  secure: env.COOKIE_SECURE || isProd,
  sameSite: "lax" as const,
  domain: env.COOKIE_DOMAIN || undefined,
  path: "/",
  maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
});

export const loginController = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.login(req.body as LoginInput);
  res.cookie(ACCESS_COOKIE, result.accessToken, cookieOptions());
  await recordAudit(req, result.user, { action: "LOGIN", entityType: "user", entityId: result.user.id });
  return ok(res, { user: result.user });
});

export const logoutController = asyncHandler(async (req: Request, res: Response) => {
  res.clearCookie(ACCESS_COOKIE, { ...cookieOptions(), maxAge: undefined });
  if (req.user) await recordAudit(req, req.user, { action: "LOGOUT" });
  return ok(res, { message: "Logged out" });
});

export const meController = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const user = await authService.getMe(req.user.id);
  return ok(res, { user });
});
