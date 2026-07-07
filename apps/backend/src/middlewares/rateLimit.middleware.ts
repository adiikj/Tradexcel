import rateLimit from "express-rate-limit";
import { ApiError } from "../utils/ApiError.js";

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res, next) => {
    next(new ApiError(429, "Too many attempts. Please try again later."));
  },
});

export const tradeLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res, next) => {
    next(new ApiError(429, "Too many trade requests. Please slow down."));
  },
});

// A single shared secret is a higher-value brute-force target than any one
// user's password - much tighter budget than the regular auth routes.
export const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res, next) => {
    next(new ApiError(429, "Too many attempts. Please try again later."));
  },
});
