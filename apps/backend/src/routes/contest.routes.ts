import { Router } from "express";
import { createContest, getContests, getContest, joinContest, getStandings } from "../controllers/contest.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/contests", verifyJWT, getContests);
router.post("/contests", verifyJWT, createContest);
router.get("/contests/:id", verifyJWT, getContest);
router.post("/contests/:id/join", verifyJWT, joinContest);
router.get("/contests/:id/standings", verifyJWT, getStandings);

export default router;
