import { Router } from "express";
import { getPrediction, postPrediction } from "../controllers/prediction.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { mutationLimiter } from "../middlewares/rateLimit.middleware.js";

const router = Router();

router.get("/predictions", verifyJWT, getPrediction);
router.post("/predictions", verifyJWT, mutationLimiter, postPrediction);

export default router;
