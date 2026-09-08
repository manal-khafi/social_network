import pino from "pino";

/**
 * Structured JSON logger. Level via LOG_LEVEL (default: info in prod, debug else).
 * Pipe through `pino-pretty` locally if you want colourised output:
 *   npm run serve | npx pino-pretty
 */
export const logger = pino({
  level:
    process.env.LOG_LEVEL ||
    (process.env.NODE_ENV === "production" ? "info" : "debug"),
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "res.headers['set-cookie']",
    ],
    remove: true,
  },
});
