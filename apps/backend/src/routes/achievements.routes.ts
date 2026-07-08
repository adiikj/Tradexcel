import { Router } from "express";
import { getAchievements } from "../controllers/achievements.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/achievements", verifyJWT, getAchievements);

export default router;
