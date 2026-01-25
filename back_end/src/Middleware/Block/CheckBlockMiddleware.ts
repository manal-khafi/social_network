import { Request, Response, NextFunction } from "express";
import { isBlocked } from "@/Service/BlockService";

/**
 * Middleware pour vérifier les blocages avant d'autoriser une action
 * Utiliser sur les routes où le blocage doit empêcher l'interaction
 */
export const checkBlockMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;

    // Chercher l'ID cible dans params ou body
    const targetUserId =
      req.params.userId ||
      req.params.targetUserId ||
      req.body.userId ||
      req.body.targetUserId;

    // Si pas d'utilisateur authentifié ou pas de cible, passer
    if (!userId || !targetUserId) {
      return next();
    }

    // Vérifier le blocage
    const blocked = await isBlocked(userId, targetUserId);

    if (blocked) {
      return res.status(403).json({
        success: false,
        message: "Action non autorisée en raison d'un blocage",
      });
    }

    next();
  } catch (error: any) {
    // Passer l'erreur au gestionnaire d'erreurs
    next(error);
  }
};
