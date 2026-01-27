import { Router } from "express";
import { getArchivedPosts } from "../Controllers/Archive/saveController";
import { authMiddleware } from "../Middleware/authMiddlware";

const router = Router();

// Route protégée par le middleware d'authentification
router.get("/archived", authMiddleware, getArchivedPosts as any);

export default router;