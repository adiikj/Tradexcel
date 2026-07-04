import { Router } from "express";
import { buyStock, sellStock } from "../controllers/trade.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/buy", verifyJWT, buyStock);
router.post("/sell", verifyJWT, sellStock);

export default router;
