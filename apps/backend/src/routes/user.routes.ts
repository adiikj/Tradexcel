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
  forgotPassword,
  resetPassword,
  getAvatar,
  updateAvatar,
} from "../controllers/user.controller.js";
import { verifyJWT, verifyJWTOptional } from "../middlewares/auth.middleware.js";
import { authLimiter, refreshLimiter, mutationLimiter } from "../middlewares/rateLimit.middleware.js";
import {upload} from "../middlewares/multer.middleware.js"

const router = Router();

// Public Routes
router.post("/register", authLimiter, registerUser); // User registration
router.post("/login", authLimiter, loginUser); // User login (password or pin)
router.post("/google", authLimiter, googleLogin); // Google Sign-In
router.post("/verify-otp", authLimiter, verifyOTP); // One-time email verification (signup only)
router.post("/refresh-token", refreshLimiter, refreshAccessToken); // Refresh access token
router.post("/forgot-password", authLimiter, forgotPassword); // Email a 6-digit reset code
router.post("/reset-password", authLimiter, resetPassword); // Set a new password and/or PIN with that code

// Protected Routes (Require Authentication)
router.patch("/update", verifyJWT, mutationLimiter, updateUser); // Update user profile (JWT-protected)
router.post("/logout", verifyJWTOptional, logoutUser); // User logout (JWT-protected)
router.get("/name", verifyJWT, getName); // Get user name (JWT-protected)
router.get("/profile", verifyJWT, getProfile); // Get user profile (JWT-protected)
router.patch("/change-password-pin", verifyJWT, authLimiter, changeCurrentPasswordAndPin); // Change password and pin (JWT-protected) - login-tier limit, this is account-takeover-sensitive
router.get("/getavatar", verifyJWT, getAvatar); // Get user avatar (JWT-protected)
router.patch("/updateavatar", verifyJWT, mutationLimiter, upload.single("avatar"), updateAvatar); // Update user avatar (JWT-protected)


export default router;
