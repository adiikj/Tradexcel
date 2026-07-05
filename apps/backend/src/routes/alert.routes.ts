import { Router } from "express";
import { createAlert, getAlerts, deleteAlert } from "../controllers/alert.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/alerts", verifyJWT, getAlerts);
router.post("/alerts", verifyJWT, createAlert);
router.delete("/alerts/:id", verifyJWT, deleteAlert);

export default router;
