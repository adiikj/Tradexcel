import { Router } from "express";
import { getWallet, getPortfolio, getTransactions } from "../controllers/portfolio.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/wallet", verifyJWT, getWallet);
router.get("/portfolio", verifyJWT, getPortfolio);
router.get("/transactions", verifyJWT, getTransactions);

export default router;
