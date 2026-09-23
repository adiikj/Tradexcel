import { Router } from "express";
import { adminLogin, adminLogout } from "../controllers/admin.controller.js";
import { createContest, updateContest, updateContestImage, getAdminContests } from "../controllers/contest.controller.js";
import { verifyAdmin } from "../middlewares/adminAuth.middleware.js";
import { adminLoginLimiter, mutationLimiter } from "../middlewares/rateLimit.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.post("/admin/login", adminLoginLimiter, adminLogin);
router.post("/admin/logout", adminLogout);

// Reuses the public contest create/update logic; listing has its own
// handler since admin requests have no user.
router.get("/admin/contests", verifyAdmin, getAdminContests);
router.post("/admin/contests", verifyAdmin, mutationLimiter, createContest);
router.patch("/admin/contests/:id", verifyAdmin, mutationLimiter, updateContest);
router.post("/admin/contests/:id/image", verifyAdmin, mutationLimiter, upload.single("image"), updateContestImage);

export default router;
