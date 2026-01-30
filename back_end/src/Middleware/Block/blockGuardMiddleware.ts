import { Request, Response, NextFunction, RequestHandler } from "express";
import { isBlockedEitherWay } from "../../services/BlockService";
import prisma from "../../config/prismaClient"; 

type GetTargetIdFn = (req: Request) => string | undefined;

interface BlockGuardOptions {
  getTargetId?: GetTargetIdFn;
}

export const blockGuard = (options?: BlockGuardOptions): RequestHandler => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const viewerId = req.user?.id;

      if (!viewerId) {
        return next();
      }

      let targetId: string | undefined;
      if (options?.getTargetId) {
        targetId = options.getTargetId(req);
      } else {
        targetId =
          req.params.userId ||
          req.params.targetUserId ||
          req.body.userId ||
          req.body.targetUserId ||
          req.params.postId ||
          req.body.postId;
      }

      if (!targetId) {
        return next();
      }

      let actualTargetUserId: string | undefined = targetId;

      if (req.params.postId || req.body.postId) {
          const post = await prisma.post.findUnique({
              where: { id: targetId },
              select: { user_id: true }
          });
          if (post) {
              actualTargetUserId = post.user_id;
          } else {
              return next();
          }
      }


      if (!actualTargetUserId) {
          return next(); 
      }

      const isBlocked = await isBlockedEitherWay(viewerId, actualTargetUserId);

      if (isBlocked) {
        return res.status(403).json({
          success: false,
          message: "Forbidden: Interaction blocked.",
        });
      }

      next();
    } catch (error) {
      console.error("Error in blockGuard middleware:", error);
      next(error); 
    }
  };
};
