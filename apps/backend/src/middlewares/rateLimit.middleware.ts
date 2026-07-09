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

// Baseline safety net applied to every request (see app.ts), on top of the
// tighter per-route limiters below. Generous enough that no legitimate usage
// pattern in the app should ever hit it.
export const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res, next) => {
    next(new ApiError(429, "Too many requests. Please slow down."));
  },
});

// For unauthenticated (or optionally-authenticated) endpoints reachable by
// anyone with the URL: finance quotes, player search, public profiles.
export const publicApiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res, next) => {
    next(new ApiError(429, "Too many requests. Please slow down."));
  },
});

// Account-mutation endpoints that don't already have a dedicated limiter:
// password/pin change, avatar upload, alerts, follow/unfollow, contest join.
export const mutationLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res, next) => {
    next(new ApiError(429, "Too many requests. Please slow down and try again."));
  },
});

// Refresh-token exchange - not credential-guessing risk like login, but an
// unbounded loop here would mint an unbounded number of sessions.
export const refreshLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res, next) => {
    next(new ApiError(429, "Too many requests. Please slow down."));
  },
});

// Contact-us form: unauthenticated, forwards an email per submission, so it's
// capped tightly per IP rather than per-minute like the other public routes.
export const contactLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  limit: 2,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res, next) => {
    next(new ApiError(429, "You've reached the daily limit for contact messages. Please try again tomorrow."));
  },
});
