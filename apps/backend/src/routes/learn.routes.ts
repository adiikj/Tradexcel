import { Router } from "express";
import { getLearn, startPracticeRun, getPracticeRun, tradePracticeRun, advancePracticeRun } from "../controllers/learn.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { mutationLimiter, tradeLimiter } from "../middlewares/rateLimit.middleware.js";

const router = Router();

router.get("/learn", verifyJWT, getLearn);
router.post("/practice", verifyJWT, mutationLimiter, startPracticeRun);
router.get("/practice/:id", verifyJWT, getPracticeRun);
router.post("/practice/:id/trade", verifyJWT, tradeLimiter, tradePracticeRun);
router.post("/practice/:id/advance", verifyJWT, tradeLimiter, advancePracticeRun);

export default router;
