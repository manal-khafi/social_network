import { Router } from 'express';
import { authMiddleware } from '../Middleware/authMiddlware';
import {
  setupTwoFactorAuth,
  enableTwoFactorAuth,
  disableTwoFactorAuth,
  getTwoFactorAuthStatus,
} from '../Controllers/2FA/TwoFactorAuthController';
import { twoFactorLimiter } from '../Middleware/rateLimiter';

const twoFactorRouter = Router();

twoFactorRouter.get('/2fa/status', authMiddleware, getTwoFactorAuthStatus);
twoFactorRouter.post('/2fa/setup', authMiddleware, setupTwoFactorAuth);
twoFactorRouter.post('/2fa/enable', authMiddleware, twoFactorLimiter, enableTwoFactorAuth);
twoFactorRouter.post('/2fa/disable', authMiddleware, twoFactorLimiter, disableTwoFactorAuth);

export default twoFactorRouter;
