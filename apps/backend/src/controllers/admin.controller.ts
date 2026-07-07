import crypto from "crypto";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { Response } from "express";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

interface AdminRequest {
  body: any;
}

const loginSchema = z.object({
  password: z.string().min(1, "password is required"),
});

// Constant-time comparison - a plain `===` on a single shared secret leaks
// timing information an attacker could use to guess it character-by-character.
function safeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    // Still run a comparison of equal length so failure here takes the same
    // rough time as a length-matched mismatch, rather than returning instantly.
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

const adminLogin = asyncHandler(async (req: AdminRequest, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ApiError(400, "Invalid input", parsed.error.issues);
  }

  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    throw new ApiError(500, "Admin login is not configured");
  }

  if (!safeCompare(parsed.data.password, adminPassword)) {
    throw new ApiError(401, "Incorrect password");
  }

  const token = jwt.sign(
    { role: "admin" },
    process.env.ADMIN_TOKEN_SECRET as string,
    { expiresIn: (process.env.ADMIN_TOKEN_EXPIRY || "2h") as any }
  );

  return res.status(200).json(new ApiResponse(200, "Admin login successful", { token }));
});

export { adminLogin };
