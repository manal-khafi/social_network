"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMyLikedPosts = void 0;
const prismaClient_1 = __importDefault(require("../../config/prismaClient"));
const BlockService_1 = require("../../../src/Service/BlockService");
const getMyLikedPosts = async (req, res) => {
    try {
        const userId = req.user?.id;
        const blockedIds = await (0, BlockService_1.getBlockedUserIds)(userId); // Retrieve blocked IDs
        const likedPosts = await prismaClient_1.default.like.findMany({
            where: {
                user_id: userId,
                post_id: { not: null },
                post: {
                    user_id: { notIn: blockedIds }, // Filter out liked posts from blocked users
                },
            },
            include: {
                post: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                display_name: true,
                                username: true,
                                avatar_url: true,
                            },
                        },
                        _count: {
                            select: {
                                likes: true,
                                comments: { where: { is_deleted: false } },
                            },
                        },
                    },
                },
            },
            orderBy: { created_at: "desc" },
        });
        const result = likedPosts
            .filter((like) => like.post)
            .map((like) => {
            const p = like.post;
            return {
                id: p.id,
                content: p.content,
                images: Array.isArray(p.media_urls) ? p.media_urls : [],
                userId: p.user_id,
                username: p.user?.username ?? "Unknown",
                avatar: p.user?.avatar_url ?? "",
                display_name: p.user?.display_name ?? "",
                timestamp: p.created_at,
                isEdited: p.updated_at?.getTime() !== p.created_at.getTime(),
                likes: p._count?.likes ?? 0,
                comments: p._count?.comments ?? 0,
                isLiked: true,
                isSaved: false,
                isReposted: false,
                likesVisible: true,
                commentsAllowed: true,
                shares: 0,
                originalPost: null,
            };
        });
        return res.status(200).json(result);
    }
    catch (error) {
        return res.status(500).json({ message: "Erreur serveur" });
    }
};
exports.getMyLikedPosts = getMyLikedPosts;
