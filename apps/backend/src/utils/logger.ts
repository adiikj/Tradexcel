import pino from "pino";

const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  // Bearer tokens and session cookies must never land in plaintext log
  // output — a leaked/aggregated log file would otherwise hand out live
  // sessions.
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      'res.headers["set-cookie"]',
    ],
    censor: "[redacted]",
  },
});

export default logger;
