import type { Request } from "express";
import { db } from "../../db/index";
import { auditLogs } from "../../db/schema/index";
import { logger } from "../../config/logger";
import type { AuditAction, AuthUser } from "@mentor/shared";

interface AuditInput {
  action: AuditAction;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Records an admin action (spec section 20). Best-effort: an audit failure
 * must never break the primary operation, so errors are logged, not thrown.
 */
export async function recordAudit(req: Request, user: AuthUser | undefined, input: AuditInput) {
  try {
    await db.insert(auditLogs).values({
      userId: user?.id,
      userEmail: user?.email,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      ipAddress: getClientIp(req),
      userAgent: req.headers["user-agent"]?.slice(0, 300),
      metadata: input.metadata,
    });
  } catch (err) {
    logger.error({ err, action: input.action }, "Failed to write audit log");
  }
}

function getClientIp(req: Request): string | undefined {
  const fwd = req.headers["x-forwarded-for"];
  if (typeof fwd === "string") return fwd.split(",")[0]?.trim();
  return req.ip;
}
