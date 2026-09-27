import { z } from "zod";
import { Response } from "express";
import { validationError } from "../utils/validation.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getQuests } from "../services/quests.js";
import {
  advancePractice,
  currentPracticeId,
  getPracticeState,
  listScenarios,
  practiceHistory,
  practiceTrade,
  startPractice,
} from "../services/practice.js";
import { tradeSchema } from "../services/tradeMath.js";

interface AuthRequest {
  user?: { id: string };
  params: any;
  body: any;
}

// Everything the Learn page needs in one request.
const getLearn = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const [quests, activePracticeId, history] = await Promise.all([getQuests(userId), currentPracticeId(userId), practiceHistory(userId)]);
  return res.status(200).json(new ApiResponse(200, "Learn fetched successfully", { quests, scenarios: listScenarios(), activePracticeId, history }));
});

const startSchema = z.object({ scenarioId: z.string().trim().min(1).max(50) });

const startPracticeRun = asyncHandler(async (req: AuthRequest, res: Response) => {
  const parsed = startSchema.safeParse(req.body);
  if (!parsed.success) {
    throw validationError(parsed.error);
  }
  const id = await startPractice(req.user!.id, parsed.data.scenarioId);
  return res.status(200).json(new ApiResponse(200, "Practice run started", await getPracticeState(req.user!.id, id)));
});

const getPracticeRun = asyncHandler(async (req: AuthRequest, res: Response) => {
  return res.status(200).json(new ApiResponse(200, "Practice run fetched", await getPracticeState(req.user!.id, String(req.params.id))));
});

const practiceTradeSchema = tradeSchema.extend({ side: z.enum(["BUY", "SELL"]) });

const tradePracticeRun = asyncHandler(async (req: AuthRequest, res: Response) => {
  const parsed = practiceTradeSchema.safeParse(req.body);
  if (!parsed.success) {
    throw validationError(parsed.error);
  }
  const { side, symbol, quantity } = parsed.data;
  const id = String(req.params.id);
  await practiceTrade(req.user!.id, id, side, symbol, quantity);
  return res.status(200).json(new ApiResponse(200, side === "BUY" ? "Bought" : "Sold", await getPracticeState(req.user!.id, id)));
});

const advancePracticeRun = asyncHandler(async (req: AuthRequest, res: Response) => {
  const id = String(req.params.id);
  await advancePractice(req.user!.id, id);
  return res.status(200).json(new ApiResponse(200, "Next day", await getPracticeState(req.user!.id, id)));
});

export { getLearn, startPracticeRun, getPracticeRun, tradePracticeRun, advancePracticeRun };
