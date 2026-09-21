import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { ApiError } from "../utils/ApiError";
import type { ApiResponse } from "@mentor/shared";
import { logger } from "../config/logger";
import { isProd } from "../config/env";

/**
 * Centralized error handler (spec section 26).
 * Never leaks stack traces to clients.
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
) {
  let apiError: ApiError;

  if (err instanceof ApiError) {
    apiError = err;
  } else if (err instanceof ZodError) {
    const details: Record<string, string[]> = {};
    for (const issue of err.issues) {
      const key = issue.path.join(".") || "_";
      (details[key] ??= []).push(issue.message);
    }
    apiError = ApiError.badRequest("Validation failed", details);
  } else if ((err as { code?: string })?.code === "23505") {
    // Postgres unique_violation
    apiError = ApiError.conflict("A record with these details already exists");
  } else {
    apiError = ApiError.internal();
    logger.error({ err }, "Unhandled error");
  }

  if (apiError.statusCode >= 500 && !(err instanceof ApiError)) {
    // already logged above for the generic case
  } else if (apiError.statusCode >= 500) {
    logger.error({ err }, "Server error");
  }

  const body: ApiResponse<null> = {
    success: false,
    data: null,
    error: {
      code: apiError.code,
      message: apiError.message,
      ...(apiError.details ? { details: apiError.details } : {}),
    },
  };

  // Include stack only in non-production for debugging.
  if (!isProd && apiError.statusCode >= 500) {
    (body.error as unknown as Record<string, unknown>).stack = (err as Error)?.stack;
  }

  res.status(apiError.statusCode).json(body);
}
