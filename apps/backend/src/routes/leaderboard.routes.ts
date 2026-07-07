import { Router } from "express";
import { getLeaderboard, getFriendsLeaderboard } from "../controllers/leaderboard.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/leaderboard", verifyJWT, getLeaderboard);
router.get("/leaderboard/friends", verifyJWT, getFriendsLeaderboard);

export default router;
