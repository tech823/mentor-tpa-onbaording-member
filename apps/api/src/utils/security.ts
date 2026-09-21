import bcrypt from "bcryptjs";
import jwt, { type SignOptions } from "jsonwebtoken";
import { customAlphabet } from "nanoid";
import { env } from "../config/env";
import type { Role } from "@mentor/shared";

const SALT_ROUNDS = 12;

export const hashPassword = (plain: string) => bcrypt.hash(plain, SALT_ROUNDS);
export const verifyPassword = (plain: string, hash: string) => bcrypt.compare(plain, hash);

export interface AccessTokenPayload {
  sub: string; // user id
  email: string;
  role: Role;
}

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_TTL,
  } as SignOptions);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
}

/** URL-safe, non-guessable token generator for links/sessions (spec section 19). */
const tokenAlphabet = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
const nano = customAlphabet(tokenAlphabet, 40);
export const generateSecureToken = () => nano();

/** Builds a URL-safe slug from arbitrary text (e.g. programme name). */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}
