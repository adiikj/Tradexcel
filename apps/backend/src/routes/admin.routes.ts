import { Router } from "express";
import { adminLogin } from "../controllers/admin.controller.js";
import { createContest, updateContest, updateContestImage, getContests } from "../controllers/contest.controller.js";
import { verifyAdmin } from "../middlewares/adminAuth.middleware.js";
import { adminLoginLimiter } from "../middlewares/rateLimit.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.post("/admin/login", adminLoginLimiter, adminLogin);

// Reuses the same create/list logic as the public contest routes.
router.get("/admin/contests", verifyAdmin, getContests);
router.post("/admin/contests", verifyAdmin, createContest);
router.patch("/admin/contests/:id", verifyAdmin, updateContest);
router.post("/admin/contests/:id/image", verifyAdmin, upload.single("image"), updateContestImage);

export default router;
