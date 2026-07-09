import { Router } from "express";
import { sendContactMessage, sendSupportMessage } from "../controllers/contact.controller.js";
import { contactLimiter } from "../middlewares/rateLimit.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/contact", contactLimiter, sendContactMessage);
router.post("/support", verifyJWT, contactLimiter, sendSupportMessage);

export default router;
