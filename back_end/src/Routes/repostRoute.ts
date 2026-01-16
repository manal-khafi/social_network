import { Router } from "express";
import { repostPost, removeRepost } from "../Controllers/Posts/repostController";
import { authMiddleware } from "../Middlware/authMiddlware";

const router = Router();

router.post("/:postId", authMiddleware, repostPost);
router.delete("/:postId", authMiddleware, removeRepost);

export default router;
