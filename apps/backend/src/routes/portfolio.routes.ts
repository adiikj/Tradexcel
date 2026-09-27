import { Router } from "express";
import { getWallet, getPortfolio, getTransactions, getAnalytics, updateTransactionNote } from "../controllers/portfolio.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { mutationLimiter } from "../middlewares/rateLimit.middleware.js";

const router = Router();

router.get("/wallet", verifyJWT, getWallet);
router.get("/portfolio", verifyJWT, getPortfolio);
router.get("/portfolio/analytics", verifyJWT, getAnalytics);
router.get("/transactions", verifyJWT, getTransactions);
router.patch("/transactions/:id/note", verifyJWT, mutationLimiter, updateTransactionNote);

export default router;
