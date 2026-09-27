import { Router } from "express";
import { getWatchlist, addToWatchlist, removeFromWatchlist } from "../controllers/watchlist.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { mutationLimiter } from "../middlewares/rateLimit.middleware.js";

const router = Router();

router.get("/watchlist", verifyJWT, getWatchlist);
router.put("/watchlist/:symbol", verifyJWT, mutationLimiter, addToWatchlist);
router.delete("/watchlist/:symbol", verifyJWT, mutationLimiter, removeFromWatchlist);

export default router;
