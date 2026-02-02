"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBlockedUserIds = exports.isBlockedEitherWay = exports.getBlockedCount = exports.getBlockedUsers = exports.getBlockStatus = exports.isBlocked = exports.unblockUser = exports.blockUser = void 0;
const prismaClient_1 = __importDefault(require("../config/prismaClient"));
/**
 * Validation commune
 */
const validateBlockAction = (blockerId, blockedId) => {
    if (!blockerId || !blockedId) {
        throw new Error("Les identifiants de blocage sont requis");
    }
    if (blockerId === blockedId) {
        throw new Error("Vous ne pouvez pas vous bloquer vous-même");
    }
};
/**
 * Bloquer un utilisateur
 */
const blockUser = async (blockerId, blockedId) => {
    validateBlockAction(blockerId, blockedId);
    const alredayBlocked = await prismaClient_1.default.block.findFirst({
        where: {
            blocker_id: blockerId,
            blocked_id: blockedId,
        },
    });
    if (alredayBlocked) {
        throw new Error("Cet utilisateur est déjà bloqué");
    }
    return prismaClient_1.default.$transaction(async (tx) => {
        // 1. Créer le blocage
        const block = await tx.block.create({
            data: {
                blocker_id: blockerId,
                blocked_id: blockedId,
            },
            include: {
                blocked: {
                    select: {
                        id: true,
                        username: true,
                        avatar_url: true,
                    },
                },
            },
        });
        // 2. Supprimer les follows dans les deux sens
        await tx.follow.deleteMany({
            where: {
                OR: [
                    { follower_id: blockerId, followed_id: blockedId },
                    { follower_id: blockedId, followed_id: blockerId },
                ],
            },
        });
        return block;
    });
};
exports.blockUser = blockUser;
/**
 * Débloquer un utilisateur
 */
const unblockUser = async (blockerId, blockedId) => {
    validateBlockAction(blockerId, blockedId);
    const block = await prismaClient_1.default.block.findUnique({
        where: {
            blocker_id_blocked_id: {
                blocker_id: blockerId,
                blocked_id: blockedId,
            },
        },
    });
    if (!block) {
        throw new Error("Aucun blocage trouvé pour cet utilisateur");
    }
    await prismaClient_1.default.block.delete({
        where: {
            id: block.id,
        },
    });
    return { success: true };
};
exports.unblockUser = unblockUser;
/**
 * Vérifier si deux utilisateurs sont bloqués (dans un sens ou l'autre)
 */
const isBlocked = async (userId, targetUserId) => {
    const block = await prismaClient_1.default.block.findFirst({
        where: {
            OR: [
                { blocker_id: userId, blocked_id: targetUserId },
                { blocker_id: targetUserId, blocked_id: userId },
            ],
        },
    });
    return block !== null;
};
exports.isBlocked = isBlocked;
/**
 * Obtenir le statut détaillé du blocage
 */
const getBlockStatus = async (userId, targetUserId) => {
    const blocks = await prismaClient_1.default.block.findMany({
        where: {
            OR: [
                { blocker_id: userId, blocked_id: targetUserId },
                { blocker_id: targetUserId, blocked_id: userId },
            ],
        },
    });
    return {
        isBlocked: blocks.length > 0,
        youBlockedThem: blocks.some((block) => block.blocker_id === userId),
        theyBlockedYou: blocks.some((block) => block.blocker_id === targetUserId),
    };
};
exports.getBlockStatus = getBlockStatus;
/**
 * Liste des utilisateurs bloqués avec pagination
 */
const getBlockedUsers = async (userId, page = 1, limit = 20) => {
    const skip = (page - 1) * limit;
    const [blocks, total] = await Promise.all([
        prismaClient_1.default.block.findMany({
            where: {
                blocker_id: userId,
            },
            include: {
                blocked: {
                    select: {
                        id: true,
                        username: true,
                        avatar_url: true,
                    },
                },
            },
            orderBy: {
                created_at: "desc",
            },
            skip,
            take: limit,
        }),
        prismaClient_1.default.block.count({
            where: {
                blocker_id: userId,
            },
        }),
    ]);
    return {
        blockedUsers: blocks.map((block) => ({
            id: block.blocked.id,
            username: block.blocked.username,
            avatar: block.blocked.avatar_url,
            blockedAt: block.created_at,
            blockId: block.id,
        })),
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            hasNextPage: page < Math.ceil(total / limit),
            hasPrevPage: page > 1,
        },
    };
};
exports.getBlockedUsers = getBlockedUsers;
/**
 * Obtenir le nombre d'utilisateurs bloqués
 */
const getBlockedCount = async (userId) => {
    return prismaClient_1.default.block.count({
        where: {
            blocker_id: userId,
        },
    });
};
exports.getBlockedCount = getBlockedCount;
const isBlockedEitherWay = async (viewerId, targetId) => {
    const block = await prismaClient_1.default.block.findFirst({
        where: {
            OR: [
                { blocker_id: viewerId, blocked_id: targetId },
                { blocker_id: targetId, blocked_id: viewerId },
            ],
        },
        select: { id: true },
    });
    return !!block;
};
exports.isBlockedEitherWay = isBlockedEitherWay;
const getBlockedUserIds = async (viewerId) => {
    // Users blocked by the viewer
    const blockedByViewer = await prismaClient_1.default.block.findMany({
        where: {
            blocker_id: viewerId,
        },
        select: {
            blocked_id: true,
        },
    });
    // Users who have blocked the viewer
    const blockingViewer = await prismaClient_1.default.block.findMany({
        where: {
            blocked_id: viewerId,
        },
        select: {
            blocker_id: true,
        },
    });
    const blockedIds = new Set();
    blockedByViewer.forEach((block) => blockedIds.add(block.blocked_id));
    blockingViewer.forEach((block) => blockedIds.add(block.blocker_id));
    return Array.from(blockedIds);
};
exports.getBlockedUserIds = getBlockedUserIds;
