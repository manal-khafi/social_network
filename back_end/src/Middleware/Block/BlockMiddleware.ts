import { Request, Response, NextFunction } from 'express';
import { isBlocked } from '../../Service/BlockService';

export const checkBlockMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    const targetUserId = req.params.userId || req.body.userId;

    if (!userId || !targetUserId) {
      return next();
    }

    const blocked = await isBlocked(userId, targetUserId);

    if (blocked) {
      return res.status(403).json({
        success: false,
        message: "Action non autorisée en raison d'un blocage"
      });
    }

    next();
  } catch (error: any) {
    next(error);
  }
};
