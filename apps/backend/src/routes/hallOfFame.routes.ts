import { Router } from "express";
import { getHallOfFame } from "../controllers/hallOfFame.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/hall-of-fame", verifyJWT, getHallOfFame);

export default router;
