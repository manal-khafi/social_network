import { Request, Response } from "express";
import {
  blockUser,
  unblockUser,
  isBlocked,
  getBlockStatus,
  getBlockedUsers,
  getBlockedCount,
} from "../../Service/BlockService";

/** Bloquer un utilisateur */
export const blockUserController = async (req: Request, res: Response) => {
  try {
    const blockerId = req.user?.id; // ID de l'utilisateur connecté
    const { blockedId } = req.body;

    if (!blockerId) {
      return res.status(401).json({
        success: false,
        message: "Utilisateur non authentifié",
      });
    }

    const block = await blockUser(blockerId, blockedId);

    return res.status(201).json({
      success: true,
      message: "Utilisateur bloqué avec succès",
      data: block,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || "Erreur lors du blocage de l'utilisateur",
    });
  }
};

/** Débloquer un utilisateur */
export const unblockUserController = async (req: Request, res: Response) => {
  try {
    const blockerId = req.user?.id;
    const { blockedId } = req.body;

    if (!blockerId) {
      return res.status(401).json({
        success: false,
        message: "Utilisateur non authentifié",
      });
    }

    const result = await unblockUser(blockerId, blockedId);

    return res.status(200).json({
      success: true,
      message: "Utilisateur débloqué avec succès",
      data: result,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || "Erreur lors du déblocage de l'utilisateur",
    });
  }
};

/** Vérifier si un utilisateur est bloqué */
export const checkBlockStatusController = async (
  req: Request,
  res: Response,
) => {
  try {
    const userId = req.user?.id;
    const { targetUserId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Utilisateur non authentifié",
      });
    }

    const blocked = await isBlocked(userId, targetUserId);

    return res.status(200).json({
      success: true,
      data: { isBlocked: blocked },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message:
        error.message || "Erreur lors de la vérification du statut de blocage",
    });
  }
};

/** Obtenir le statut détaillé du blocage */
export const getBlockStatusController = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { targetUserId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Utilisateur non authentifié",
      });
    }

    const status = await getBlockStatus(userId, targetUserId);

    return res.status(200).json({
      success: true,
      data: status,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message:
        error.message || "Erreur lors de la récupération du statut de blocage",
    });
  }
};

/** Obtenir la liste des utilisateurs bloqués */
export const getBlockedUsersController = async (
  req: Request,
  res: Response,
) => {
  try {
    const userId = req.user?.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Utilisateur non authentifié",
      });
    }

    const result = await getBlockedUsers(userId, page, limit);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Erreur lors de la récupération des utilisateurs bloqués",
    });
  }
};

/** Obtenir le nombre d'utilisateurs bloqués */
export const getBlockedCountController = async (
  req: Request,
  res: Response,
) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Utilisateur non authentifié",
      });
    }

    const count = await getBlockedCount(userId);

    return res.status(200).json({
      success: true,
      data: { count },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Erreur lors du comptage des blocages",
    });
  }
};
