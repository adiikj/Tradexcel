import { z } from "zod";
import { Response } from "express";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { validationError } from "../utils/validation.js";
import { chatEnabled } from "./runtime/config.js";
import { getChatEngine } from "./runtime/engine.js";

interface AuthRequest {
  user?: { id: string };
  body: any;
}

const chatSchema = z.object({
  message: z.string().trim().min(1, "message is required").max(500, "message must be at most 500 characters"),
});

// The engine loads the model on boot; a request that arrives before it's
// ready waits a little, then gets a friendly 503 instead of hanging.
const STARTUP_WAIT_MS = 20_000;

const chat = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!chatEnabled()) {
    throw new ApiError(503, "The assistant is turned off right now.");
  }
  const parsed = chatSchema.safeParse(req.body);
  if (!parsed.success) {
    throw validationError(parsed.error);
  }

  let timer: NodeJS.Timeout | undefined;
  const engine = await Promise.race([
    getChatEngine(),
    new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new ApiError(503, "The assistant is still starting up. Please try again in a few seconds.")), STARTUP_WAIT_MS);
    }),
  ])
    .catch((error) => {
      throw error instanceof ApiError ? error : new ApiError(503, "The assistant is unavailable right now. Please try again later.");
    })
    .finally(() => clearTimeout(timer));

  const reply = await engine.reply(parsed.data.message, req.user!.id);
  return res.status(200).json(new ApiResponse(200, "Reply generated", reply));
});

export { chat };
