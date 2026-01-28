import { Router } from 'express';
import { toggleLike } from '../Controllers/like/likeController';
import { authMiddleware } from '../Middleware/authMiddlware';
import { blockGuard } from '../Middleware/Block/blockGuardMiddleware';

const router = Router();

router.post('/posts/:postId/like', authMiddleware, blockGuard(), toggleLike);

export default router;
