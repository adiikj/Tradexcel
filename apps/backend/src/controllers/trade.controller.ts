import type { Side } from "@prisma/client";
import { Response } from "express";
import { validationError } from "../utils/validation.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { orderSchema } from "../services/tradeMath.js";
import { placeOrder, cancelQueuedOrder, listQueuedOrders } from "../services/queuedOrders.js";
import { checkAndAwardAchievements } from "../services/achievements.js";
import logger from "../utils/logger.js";

interface AuthRequest {
  user?: { id: string };
  params: any;
  body: any;
}

// Fills right away when the market is open and the order's price condition
// holds. Otherwise (market closed, or a limit / stop-loss order still waiting
// for its price) the order is left pending (202); jobs/queuedOrders.ts fills it.
const placeOrderFor = (side: Side) =>
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const parsed = orderSchema.safeParse(req.body);
    if (!parsed.success) {
      throw validationError(parsed.error);
    }
    const userId = req.user!.id;

    const placed = await placeOrder(userId, side, parsed.data);
    if (!placed.filled) {
      return res.status(202).json(new ApiResponse(202, placed.message, { queued: true, order: placed.order }));
    }

    checkAndAwardAchievements(userId).catch((error) => logger.error({ err: error }, "Error checking achievements"));

    return res
      .status(200)
      .json(new ApiResponse(200, side === "BUY" ? "Stock purchased successfully" : "Stock sold successfully", placed.result));
  });

const buyStock = placeOrderFor("BUY");
const sellStock = placeOrderFor("SELL");

const getQueuedOrders = asyncHandler(async (req: AuthRequest, res: Response) => {
  const orders = await listQueuedOrders(req.user!.id);
  return res.status(200).json(new ApiResponse(200, "Orders fetched successfully", orders));
});

const cancelOrder = asyncHandler(async (req: AuthRequest, res: Response) => {
  await cancelQueuedOrder(req.user!.id, String(req.params.id));
  return res.status(200).json(new ApiResponse(200, "Order cancelled", null));
});

export { buyStock, sellStock, getQueuedOrders, cancelOrder };
