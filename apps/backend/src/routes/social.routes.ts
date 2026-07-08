import { Router } from "express";
import {
  getPublicProfile,
  searchUsers,
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  getActivityFeed,
} from "../controllers/social.controller.js";
import { verifyJWT, verifyJWTOptional } from "../middlewares/auth.middleware.js";
import { publicApiLimiter, mutationLimiter } from "../middlewares/rateLimit.middleware.js";

const router = Router();

router.get("/social/search", verifyJWTOptional, publicApiLimiter, searchUsers);
router.get("/users/:username/profile", verifyJWTOptional, publicApiLimiter, getPublicProfile);
router.post("/users/:username/follow", verifyJWT, mutationLimiter, followUser);
router.delete("/users/:username/follow", verifyJWT, mutationLimiter, unfollowUser);
router.get("/users/:username/followers", verifyJWT, getFollowers);
router.get("/users/:username/following", verifyJWT, getFollowing);
router.get("/social/activity", verifyJWT, getActivityFeed);

export default router;
