import { Router } from "express";
import {
  createPrivateContest,
  getContests,
  getContest,
  joinContest,
  joinPrivateContest,
  getStandings,
} from "../controllers/contest.controller.js";
import { buyContestStock, sellContestStock, getContestPortfolio } from "../controllers/contestTrade.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { tradeLimiter, mutationLimiter } from "../middlewares/rateLimit.middleware.js";

const router = Router();

// Contest creation/management is admin-only - see admin.routes.ts. Regular
// users can browse public contests, create private leagues, join by invite
// code, trade within joined contests, and view standings they have access to.
router.get("/contests", verifyJWT, getContests);
router.post("/contests/private", verifyJWT, mutationLimiter, createPrivateContest);
router.post("/contests/private/join", verifyJWT, mutationLimiter, joinPrivateContest);
router.get("/contests/:id", verifyJWT, getContest);
router.post("/contests/:id/join", verifyJWT, mutationLimiter, joinContest);
router.get("/contests/:id/standings", verifyJWT, getStandings);
router.get("/contests/:id/portfolio", verifyJWT, getContestPortfolio);
router.post("/contests/:id/trade/buy", verifyJWT, tradeLimiter, buyContestStock);
router.post("/contests/:id/trade/sell", verifyJWT, tradeLimiter, sellContestStock);

export default router;
