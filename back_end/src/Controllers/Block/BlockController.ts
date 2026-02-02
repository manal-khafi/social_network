import { Request, Response } from "express";
// Utilisation du chemin relatif pour éviter l'erreur TS2307 (Cannot find module)
import * as BlockService from "../../services/BlockService";

/**
 * Interface AuthRequest : Définition locale pour résoudre l'erreur sur blockedUserId 
 * et lier les propriétés de ton modèle Prisma User.
 */
interface AuthRequest extends Request {
  user?: Request['user'];
  // On définit explicitement la structure du body pour que TypeScript reconnaisse blockedUserId
  body: {
    blockedUserId: string;
    [key: string]: any;
  };
}

/**
 * Utilitaire : vérifier l'Authentication
 */
const requireAuth = (userId?: string) => {
  if (!userId) {
    throw new Error("Non authentifié");
  }
};

/**
 * POST /api/blocks
 * Bloquer un utilisateur
 */
export const blockUser = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { blockedUserId } = req.body;
    requireAuth(userId);

    if (!blockedUserId) {
      return res.status(400).json({
        success: false,
        message: "L'ID de l'utilisateur à bloquer est requis",
      });
    }

    const block = await BlockService.blockUser(userId!, blockedUserId);

    return res.status(201).json({
      success: true,
      message: "Utilisateur bloqué avec succès",
      data: block,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * DELETE /api/blocks
 * Débloquer un utilisateur
 */
export const unblockUser = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { blockedUserId } = req.body;
    requireAuth(userId);

    if (!blockedUserId) {
      return res.status(400).json({
        success: false,
        message: "L'ID de l'utilisateur à débloquer est requis",
      });
    }

    await BlockService.unblockUser(userId!, blockedUserId);

    return res.status(200).json({
      success: true,
      message: "Utilisateur débloqué avec succès",
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * GET /api/blocks/check/:targetUserId
 * Vérifier si un utilisateur est bloqué
 */
export const checkBlock = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { targetUserId } = req.params as { [key: string]: string };
    requireAuth(userId);
    const blocked = await BlockService.isBlocked(userId!, targetUserId);
    return res.status(200).json({
      success: true,
      isBlocked: blocked,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * GET /api/blocks/status/:targetUserId
 * Obtenir le statut détaillé du blocage
 */
export const getBlockStatus = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { targetUserId } = req.params as { [key: string]: string };
    requireAuth(userId);

    const status = await BlockService.getBlockStatus(userId!, targetUserId);

    return res.status(200).json({
      success: true,
      data: status,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * GET /api/blocks
 * Liste des utilisateurs bloqués
 */
export const getBlockedUsers = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    requireAuth(userId);

    const result = await BlockService.getBlockedUsers(userId!, page, limit);

    return res.status(200).json({
      success: true,
      data: result.blockedUsers,
      pagination: result.pagination,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * GET /api/blocks/count
 * Nombre d'utilisateurs bloqués
 */
export const getBlockedCount = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    requireAuth(userId);

    const count = await BlockService.getBlockedCount(userId!);

    return res.status(200).json({
      success: true,
      data: { count },
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};