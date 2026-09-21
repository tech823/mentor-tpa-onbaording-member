import type { AuthUser } from "@mentor/shared";

declare global {
  namespace Express {
    interface Request {
      /** Populated by requireAuth for admin-plane routes. */
      user?: AuthUser;
    }
  }
}

export {};
