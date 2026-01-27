import { Router } from "express";
import {
  blockUser,
  unblockUser,
  checkBlock,
  getBlockStatus,
  getBlockedCount,
  getBlockedUsers,
} from "../Controllers/Block/BlockController";
import { authMiddleware } from "../Middleware/authMiddlware";
import { checkBlockMiddleware } from "../Middleware/Block/CheckBlockMiddleware";

const BlockRoutes = Router();

// Toutes les routes nécessitent une Authentication
BlockRoutes.use(authMiddleware);

// POST /api/blocks - Bloquer un utilisateur
BlockRoutes.post("/blocks", blockUser, checkBlockMiddleware);

// DELETE /api/blocks - Débloquer un utilisateur
BlockRoutes.delete("/blocks", unblockUser, checkBlockMiddleware);

// GET /api/blocks/check/:targetUserId - Vérifier si bloqué (simple)
BlockRoutes.get("/blocks/check/:targetUserId", checkBlock, checkBlockMiddleware);

// GET /api/blocks/status/:targetUserId - Statut détaillé du blocage
BlockRoutes.get(
  "/blocks/status/:targetUserId",
  getBlockStatus,
  checkBlockMiddleware
);

// GET /api/blocks/count - Nombre d'utilisateurs bloqués
BlockRoutes.get("/blocks/count", getBlockedCount, checkBlockMiddleware);

// GET /api/blocks - Liste des utilisateurs bloqués (doit être en dernier)
BlockRoutes.get("/blocks", getBlockedUsers, checkBlockMiddleware);

export default BlockRoutes;
