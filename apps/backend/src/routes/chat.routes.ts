import { Router } from "express";
import { chat } from "../chat/chat.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { chatLimiter } from "../middlewares/rateLimit.middleware.js";

const router = Router();

router.post("/chat", verifyJWT, chatLimiter, chat);

export default router;
