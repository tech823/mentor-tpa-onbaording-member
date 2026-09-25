import pino from "pino";
import { env, isProd } from "./env";

/**
 * Structured logger (spec section 2 / 19). JSON by default (production-safe and
 * bundle-safe). Opt into pretty local logs with LOG_PRETTY=true — this keeps the
 * pino-pretty transport out of the production bundle so it never fails to load.
 */
const usePretty = process.env.LOG_PRETTY === "true";
export const logger = pino({
  level: isProd ? "info" : "debug",
  transport: usePretty
    ? {
        target: "pino-pretty",
        options: { colorize: true, translateTime: "SYS:HH:MM:ss", ignore: "pid,hostname" },
      }
    : undefined,
  redact: {
    paths: ["req.headers.authorization", "req.headers.cookie", "password", "*.password"],
    censor: "[redacted]",
  },
  base: { env: env.NODE_ENV },
});
