import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Request, Response, NextFunction } from "express";

// Deliberately separate from verifyJWT: a distinct secret, a distinct token
// shape (role claim, no user id/DB lookup), and no relationship to the
// regular User table. Leaking one system's signing key must not grant
// access to the other.
export const verifyAdmin = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    throw new ApiError(401, "Admin authentication required");
  }

  let decoded: any;
  try {
    decoded = jwt.verify(token, process.env.ADMIN_TOKEN_SECRET as string);
  } catch (error) {
    throw new ApiError(401, "Invalid or expired admin token");
  }

  if (decoded?.role !== "admin") {
    throw new ApiError(401, "Invalid admin token");
  }

  next();
});
