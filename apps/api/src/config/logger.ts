import pino from "pino";
import { env, isProd } from "./env";

/** Structured logger (spec section 2 / 19). Pretty in dev, JSON in prod. */
export const logger = pino({
  level: isProd ? "info" : "debug",
  transport: isProd
    ? undefined
    : {
        target: "pino-pretty",
        options: { colorize: true, translateTime: "SYS:HH:MM:ss", ignore: "pid,hostname" },
      },
  redact: {
    paths: ["req.headers.authorization", "req.headers.cookie", "password", "*.password"],
    censor: "[redacted]",
  },
  base: { env: env.NODE_ENV },
});
