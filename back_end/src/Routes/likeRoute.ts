import { Router } from 'express';
import { toggleLike } from '../Controllers/likeController';
import { authMiddleware } from '../Middleware/authMiddlware';

const router = Router();

router.post('/posts/:postId/like', authMiddleware, toggleLike);

export default router;
