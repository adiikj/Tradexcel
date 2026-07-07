import { Router } from "express";
import { getNews } from "../controllers/news.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/news", verifyJWT, getNews);

export default router;
