import { Router } from "express";
import { getArchivedPosts } from "../Controllers/Archive/saveController";
import { authMiddleware } from "../Middleware/authMiddlware";

import { blockGuard } from "../Middleware/Block/blockGuardMiddleware";

const router = Router();

// Route protégée par le middleware d'authentification
router.get("/archived", authMiddleware, blockGuard(), getArchivedPosts as any);

export default router;