import { Router } from "express";
import { adminLogin } from "../controllers/admin.controller.js";
import { createContest, getContests } from "../controllers/contest.controller.js";
import { verifyAdmin } from "../middlewares/adminAuth.middleware.js";
import { adminLoginLimiter } from "../middlewares/rateLimit.middleware.js";

const router = Router();

router.post("/admin/login", adminLoginLimiter, adminLogin);

// Reuses the same create/list logic as the public contest routes — neither
// touches req.user, so they work unchanged under admin auth instead of a
// regular user session.
router.get("/admin/contests", verifyAdmin, getContests);
router.post("/admin/contests", verifyAdmin, createContest);

export default router;
