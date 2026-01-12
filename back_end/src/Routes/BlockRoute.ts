import { Router } from "express";
import {
  blockUser,
  unblockUser,
  checkBlock,
  getBlockStatus,
  getBlockedCount,
  getBlockedUsers,
} from "../Controllers/Block/BlockController";
import { authMiddleware } from "../Middlware/authMiddlware";
import { checkBlockMiddleware } from "../Middlware/Block/CheckBlockMiddleware";

const router = Router();

// Toutes les routes nécessitent une authentification
router.use(authMiddleware);

// POST /api/blocks - Bloquer un utilisateur
router.post("/blocks", blockUser, checkBlockMiddleware);

// DELETE /api/blocks - Débloquer un utilisateur
router.delete("/blocks", unblockUser, checkBlockMiddleware);

// GET /api/blocks/check/:targetUserId - Vérifier si bloqué (simple)
router.get("/blocks/check/:targetUserId", checkBlock, checkBlockMiddleware);

// GET /api/blocks/status/:targetUserId - Statut détaillé du blocage
router.get(
  "/blocks/status/:targetUserId",
  getBlockStatus,
  checkBlockMiddleware
);

// GET /api/blocks/count - Nombre d'utilisateurs bloqués
router.get("/blocks/count", getBlockedCount, checkBlockMiddleware);

// GET /api/blocks - Liste des utilisateurs bloqués (doit être en dernier)
router.get("/blocks", getBlockedUsers, checkBlockMiddleware);

export default router;
