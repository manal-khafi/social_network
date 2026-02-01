import { Router } from "express";
import { blockUserController, unblockUserController, checkBlockStatusController, getBlockStatusController, getBlockedUsersController, getBlockedCountController,} from "../Controllers/Block/BlockController";
import { authMiddleware } from "../Middleware/authMiddlware";

const router = Router();

// Toutes les routes nécessitent une authentification
router.use(authMiddleware);

// Bloquer un utilisateur
router.post("/block", blockUserController);

// Débloquer un utilisateur
router.post("/unblock", unblockUserController);

// Vérifier si un utilisateur est bloqué
router.get("/check/:targetUserId", checkBlockStatusController);

// Obtenir le statut détaillé du blocage
router.get("/status/:targetUserId", getBlockStatusController);

// Obtenir la liste des utilisateurs bloqués (avec pagination)
router.get("/blocked-users", getBlockedUsersController);

// Obtenir le nombre d'utilisateurs bloqués
router.get("/blocked-count", getBlockedCountController);

export default router;
