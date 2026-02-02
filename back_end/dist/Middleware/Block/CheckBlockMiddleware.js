"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkBlockMiddleware = void 0;
const BlockService_1 = require("../../Service/BlockService");
/**
 * Middleware pour vérifier les blocages avant d'autoriser une action
 * Utiliser sur les routes où le blocage doit empêcher l'interaction
 */
const checkBlockMiddleware = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        // Chercher l'ID cible dans params ou body
        const targetUserId = req.params.userId ||
            req.params.targetUserId ||
            req.body.userId ||
            req.body.targetUserId;
        // Si pas d'utilisateur authentifié ou pas de cible, passer
        if (!userId || !targetUserId) {
            return next();
        }
        // Vérifier le blocage
        const blocked = await (0, BlockService_1.isBlocked)(userId, targetUserId);
        if (blocked) {
            return res.status(403).json({
                success: false,
                message: "Action non autorisée en raison d'un blocage",
            });
        }
        next();
    }
    catch (error) {
        // Passer l'erreur au gestionnaire d'erreurs
        next(error);
    }
};
exports.checkBlockMiddleware = checkBlockMiddleware;
