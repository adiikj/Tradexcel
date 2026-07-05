import { Router } from "express";
import {
  registerUser,
  loginUser,
  googleLogin,
  logoutUser,
  verifyOTP,
  refreshAccessToken,
  getName,
  updateUser,
  getProfile,
  changeCurrentPasswordAndPin,
  getAvatar,
  updateAvatar,
} from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { authLimiter } from "../middlewares/rateLimit.middleware.js";
import {upload} from "../middlewares/multer.middleware.js"

const router = Router();

// Public Routes
router.post("/register", authLimiter, registerUser); // User registration
router.post("/login", authLimiter, loginUser); // User login (password or pin)
router.post("/google", authLimiter, googleLogin); // Google Sign-In
router.post("/verify-otp", authLimiter, verifyOTP); // One-time email verification (signup only)
router.post("/refresh-token", refreshAccessToken); // Refresh access token

// Protected Routes (Require Authentication)
router.patch("/update", verifyJWT, updateUser); // Update user profile (JWT-protected)
router.post("/logout", verifyJWT, logoutUser); // User logout (JWT-protected)
router.get("/name", verifyJWT, getName); // Get user name (JWT-protected)
router.get("/profile", verifyJWT, getProfile); // Get user profile (JWT-protected)
router.patch("/change-password-pin", verifyJWT, changeCurrentPasswordAndPin); // Change password and pin (JWT-protected)
router.get("/getavatar", verifyJWT, getAvatar); // Get user avatar (JWT-protected)
router.patch("/updateavatar", verifyJWT, upload.single("avatar"), updateAvatar); // Update user avatar (JWT-protected)


export default router;
