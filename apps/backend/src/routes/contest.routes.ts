import { Router } from "express";
import { getContests, getContest, joinContest, getStandings } from "../controllers/contest.controller.js";
import { buyContestStock, sellContestStock, getContestPortfolio } from "../controllers/contestTrade.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { tradeLimiter } from "../middlewares/rateLimit.middleware.js";

const router = Router();

// Contest creation/management is admin-only - see admin.routes.ts. Regular
// users can only browse, join, trade within, and view standings for contests.
router.get("/contests", verifyJWT, getContests);
router.get("/contests/:id", verifyJWT, getContest);
router.post("/contests/:id/join", verifyJWT, joinContest);
router.get("/contests/:id/standings", verifyJWT, getStandings);
router.get("/contests/:id/portfolio", verifyJWT, getContestPortfolio);
router.post("/contests/:id/trade/buy", verifyJWT, tradeLimiter, buyContestStock);
router.post("/contests/:id/trade/sell", verifyJWT, tradeLimiter, sellContestStock);

export default router;
