import { Router } from "express";
import { createAlert, getAlerts, deleteAlert } from "../controllers/alert.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { mutationLimiter } from "../middlewares/rateLimit.middleware.js";

const router = Router();

router.get("/alerts", verifyJWT, getAlerts);
router.post("/alerts", verifyJWT, mutationLimiter, createAlert);
router.delete("/alerts/:id", verifyJWT, mutationLimiter, deleteAlert);

export default router;
