import { z } from "zod";
import { Response } from "express";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import prisma from "../db/prisma.js";

interface AuthRequest {
  user?: { id: string };
  params: any;
  query: any;
  body: any;
}

const createAlertSchema = z.object({
  symbol: z
    .string()
    .trim()
    .min(1, "symbol is required")
    .max(15, "symbol is too long")
    .transform((s) => s.toUpperCase()),
  targetPrice: z.coerce.number().positive("targetPrice must be positive"),
  direction: z.enum(["ABOVE", "BELOW"]),
});

const createAlert = asyncHandler(async (req: AuthRequest, res: Response) => {
  const parsed = createAlertSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ApiError(400, "Invalid input", parsed.error.issues);
  }
  const { symbol, targetPrice, direction } = parsed.data;
  const userId = req.user!.id;

  const alert = await prisma.priceAlert.create({
    data: { userId, symbol, targetPrice, direction },
  });

  return res.status(200).json(new ApiResponse(200, "Alert created successfully", alert));
});

const listAlertsQuerySchema = z.object({
  status: z.enum(["active", "triggered"]).optional(),
});

const getAlerts = asyncHandler(async (req: AuthRequest, res: Response) => {
  const parsed = listAlertsQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    throw new ApiError(400, "Invalid query parameters", parsed.error.issues);
  }
  const { status } = parsed.data;
  const userId = req.user!.id;

  const alerts = await prisma.priceAlert.findMany({
    where: {
      userId,
      ...(status === "active" ? { triggered: false } : {}),
      ...(status === "triggered" ? { triggered: true } : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  return res.status(200).json(new ApiResponse(200, "Alerts fetched successfully", alerts));
});

const deleteAlert = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const alert = await prisma.priceAlert.findUnique({ where: { id: req.params.id } });

  if (!alert || alert.userId !== userId) {
    throw new ApiError(404, "Alert not found");
  }

  await prisma.priceAlert.delete({ where: { id: alert.id } });

  return res.status(200).json(new ApiResponse(200, "Alert deleted successfully", null));
});

export { createAlert, getAlerts, deleteAlert };
