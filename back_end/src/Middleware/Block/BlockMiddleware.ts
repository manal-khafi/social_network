import type { RequestHandler } from "express";
import { isBlockedEitherWay } from "../../services/BlockService";

export const checkBlockMiddleware: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const targetUserId = req.params.userId || req.body.userId;

    if (!userId || !targetUserId) return next();

    const blocked = await isBlockedEitherWay(userId, targetUserId);

    if (blocked) {
      return res.status(403).json({
        success: false,
        message: "Action not allowed due to a block",
      });
    }

    return next();
  } catch (error) {
    return next(error);
  }
};
