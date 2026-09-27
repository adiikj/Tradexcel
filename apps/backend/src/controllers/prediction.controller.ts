import { z } from "zod";
import { Response } from "express";
import { validationError } from "../utils/validation.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getPredictions, makePrediction } from "../services/predictions.js";

interface AuthRequest {
  user?: { id: string };
  body: any;
}

const getPrediction = asyncHandler(async (req: AuthRequest, res: Response) => {
  return res.status(200).json(new ApiResponse(200, "Prediction fetched", await getPredictions(req.user!.id)));
});

const predictionSchema = z.object({ direction: z.enum(["UP", "DOWN"]) });

const postPrediction = asyncHandler(async (req: AuthRequest, res: Response) => {
  const parsed = predictionSchema.safeParse(req.body);
  if (!parsed.success) {
    throw validationError(parsed.error);
  }
  return res.status(200).json(new ApiResponse(200, "Call saved", await makePrediction(req.user!.id, parsed.data.direction)));
});

export { getPrediction, postPrediction };
