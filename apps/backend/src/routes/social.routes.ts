import { Router } from "express";
import {
  getPublicProfile,
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  getActivityFeed,
} from "../controllers/social.controller.js";
import { verifyJWT, verifyJWTOptional } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/users/:username/profile", verifyJWTOptional, getPublicProfile);
router.post("/users/:username/follow", verifyJWT, followUser);
router.delete("/users/:username/follow", verifyJWT, unfollowUser);
router.get("/users/:username/followers", verifyJWT, getFollowers);
router.get("/users/:username/following", verifyJWT, getFollowing);
router.get("/social/activity", verifyJWT, getActivityFeed);

export default router;
