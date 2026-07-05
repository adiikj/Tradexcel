import { Router } from "express";
import { buyStock, sellStock } from "../controllers/trade.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { tradeLimiter } from "../middlewares/rateLimit.middleware.js";

const router = Router();

router.post("/buy", verifyJWT, tradeLimiter, buyStock);
router.post("/sell", verifyJWT, tradeLimiter, sellStock);

export default router;
