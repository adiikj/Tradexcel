import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import prisma from "../db/prisma.js";
import { Request, Response, NextFunction } from "express";

interface AuthRequest extends Request {
    user?: any;
}

export const verifyJWT = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");

        if(!token){
            throw new ApiError(401, "Please sign in to continue.");
        }

        const decodedToken: any = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET as string);
        const user = await prisma.user.findUnique({
            where: { id: decodedToken?.id },
            omit: { password: true, refreshToken: true },
        });

        if(!user){
            throw new ApiError(401, "Your session has expired. Please sign in again.");
        }

        req.user = user;
        next();
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(401, "Your session has expired. Please sign in again.");
    }
});

// Same token check as verifyJWT, but never blocks the request - just leaves
// req.user unset for anonymous callers. Used by routes that stay public
// (e.g. shared profile links) but still personalize when a viewer is logged in.
export const verifyJWTOptional = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");

    if (token) {
        try {
            const decodedToken: any = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET as string);
            const user = await prisma.user.findUnique({
                where: { id: decodedToken?.id },
                omit: { password: true, refreshToken: true },
            });
            if (user) req.user = user;
        } catch (error) {
            // Invalid/expired token: proceed as anonymous rather than failing.
        }
    }

    next();
});
