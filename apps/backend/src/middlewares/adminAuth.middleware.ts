import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Request, Response, NextFunction } from "express";
import { ADMIN_COOKIE } from "../constants.js";

// Separate secret and token shape from verifyJWT so leaking one key can't grant the other's access.
export const verifyAdmin = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies?.[ADMIN_COOKIE];

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
