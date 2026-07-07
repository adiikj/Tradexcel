import { Router } from "express";
import { getNotifications, markNotificationsRead } from "../controllers/notification.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/notifications", verifyJWT, getNotifications);
router.post("/notifications/read-all", verifyJWT, markNotificationsRead);

export default router;
