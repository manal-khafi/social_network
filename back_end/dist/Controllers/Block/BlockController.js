"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBlockedCount = exports.getBlockedUsers = exports.getBlockStatus = exports.checkBlock = exports.unblockUser = exports.blockUser = void 0;
// Utilisation du chemin relatif pour éviter l'erreur TS2307 (Cannot find module)
const BlockService = __importStar(require("../../services/BlockService"));
/**
 * Utilitaire : vérifier l'Authentication
 */
const requireAuth = (userId) => {
    if (!userId) {
        throw new Error("Non authentifié");
    }
};
/**
 * POST /api/blocks
 * Bloquer un utilisateur
 */
const blockUser = async (req, res) => {
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
        const block = await BlockService.blockUser(userId, blockedUserId);
        return res.status(201).json({
            success: true,
            message: "Utilisateur bloqué avec succès",
            data: block,
        });
    }
    catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};
exports.blockUser = blockUser;
/**
 * DELETE /api/blocks
 * Débloquer un utilisateur
 */
const unblockUser = async (req, res) => {
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
        await BlockService.unblockUser(userId, blockedUserId);
        return res.status(200).json({
            success: true,
            message: "Utilisateur débloqué avec succès",
        });
    }
    catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};
exports.unblockUser = unblockUser;
/**
 * GET /api/blocks/check/:targetUserId
 * Vérifier si un utilisateur est bloqué
 */
const checkBlock = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { targetUserId } = req.params;
        if (typeof targetUserId !== 'string') {
            return res.status(400).json({ success: false, message: "Invalid user ID." });
        }
        requireAuth(userId);
        const blocked = await BlockService.isBlocked(userId, targetUserId);
        return res.status(200).json({
            success: true,
            isBlocked: blocked,
        });
    }
    catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};
exports.checkBlock = checkBlock;
/**
 * GET /api/blocks/status/:targetUserId
 * Obtenir le statut détaillé du blocage
 */
const getBlockStatus = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { targetUserId } = req.params;
        if (typeof targetUserId !== 'string') {
            return res.status(400).json({ success: false, message: "Invalid user ID." });
        }
        requireAuth(userId);
        const status = await BlockService.getBlockStatus(userId, targetUserId);
        return res.status(200).json({
            success: true,
            data: status,
        });
    }
    catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};
exports.getBlockStatus = getBlockStatus;
/**
 * GET /api/blocks
 * Liste des utilisateurs bloqués
 */
const getBlockedUsers = async (req, res) => {
    try {
        const userId = req.user?.id;
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 20;
        requireAuth(userId);
        const result = await BlockService.getBlockedUsers(userId, page, limit);
        return res.status(200).json({
            success: true,
            data: result.blockedUsers,
            pagination: result.pagination,
        });
    }
    catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};
exports.getBlockedUsers = getBlockedUsers;
/**
 * GET /api/blocks/count
 * Nombre d'utilisateurs bloqués
 */
const getBlockedCount = async (req, res) => {
    try {
        const userId = req.user?.id;
        requireAuth(userId);
        const count = await BlockService.getBlockedCount(userId);
        return res.status(200).json({
            success: true,
            data: { count },
        });
    }
    catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};
exports.getBlockedCount = getBlockedCount;
