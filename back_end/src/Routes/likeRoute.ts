import { Router } from 'e';
import { toggleLike } from '../Controllers/likeController';
import { authMiddleware } from '../Middlware/authMiddlware';

const router = Router();

router.post('/posts/:postId/like', authMiddleware, toggleLike);

export default router;