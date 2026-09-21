import rateLimit from "express-rate-limit";

/** Stricter limiter for auth endpoints (brute-force protection). */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, data: null, error: { code: "TOO_MANY_REQUESTS", message: "Too many attempts, try again later" } },
});

/** Limiter for public onboarding endpoints (spec section 19). */
export const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, data: null, error: { code: "TOO_MANY_REQUESTS", message: "Too many requests, please slow down" } },
});
