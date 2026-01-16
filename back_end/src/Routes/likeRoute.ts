import { Router } from 'express';
import { toggleLike } from '../Controllers/likeController';
import { authMiddleware } from '../Middlware/authMiddlware';

const router = Router();

router.post("/:postId/like", authMiddleware, toggleLike);
router.delete("/:postId/like", authMiddleware, toggleLike);

export default router;