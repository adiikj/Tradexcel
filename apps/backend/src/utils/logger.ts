import pino from "pino";

const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  // Never log bearer tokens or session cookies in plaintext.
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
