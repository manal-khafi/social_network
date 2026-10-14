import { Router } from 'express';
import { authMiddleware } from '../Middleware/authMiddlware';
import {
  setupTwoFactorAuth,
  enableTwoFactorAuth,
  disableTwoFactorAuth,
  getTwoFactorAuthStatus,
  verifyTwoFactorLogin,
} from '../Controllers/2FA/TwoFactorAuthController';
import { twoFactorLimiter } from '../Middleware/rateLimiter';

const twoFactorRouter = Router();

// Second step of login (no access token exists yet, so no authMiddleware).
twoFactorRouter.post('/2fa/verify-login', twoFactorLimiter, verifyTwoFactorLogin);

twoFactorRouter.get('/2fa/status', authMiddleware, getTwoFactorAuthStatus);
twoFactorRouter.post('/2fa/setup', authMiddleware, setupTwoFactorAuth);
twoFactorRouter.post('/2fa/enable', authMiddleware, twoFactorLimiter, enableTwoFactorAuth);
twoFactorRouter.post('/2fa/disable', authMiddleware, twoFactorLimiter, disableTwoFactorAuth);

export default twoFactorRouter;
