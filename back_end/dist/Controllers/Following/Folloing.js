"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const prismaClient_1 = __importDefault(require("../../config/prismaClient"));
const Following = async (req, res) => {
    const userId = req.params.userId;
    const viewerId = req.user?.id;
    try {
        const follows = await prismaClient_1.default.follow.findMany({
            where: {
                follower_id: userId,
                status: "accepted",
            },
            include: {
                followed: {
                    select: {
                        id: true,
                        username: true,
                        display_name: true,
                        avatar_url: true,
                        is_private: true,
                        cover_image: true,
                    },
                },
            },
            orderBy: { created_at: "desc" },
        });
        const total = await prismaClient_1.default.follow.count({
            where: {
                follower_id: userId,
                status: "accepted",
            },
        });
        const followedIds = follows.map((f) => f.followed.id);
        let viewerFollowingIds = new Set();
        if (viewerId && followedIds.length > 0) {
            const viewerFollows = await prismaClient_1.default.follow.findMany({
                where: {
                    follower_id: viewerId,
                    followed_id: { in: followedIds },
                    status: "accepted",
                },
                select: { followed_id: true },
            });
            viewerFollowingIds = new Set(viewerFollows.map((f) => f.followed_id));
        }
        const users = follows.map((f) => ({
            id: f.followed.id,
            username: f.followed.username,
            display_name: f.followed.display_name,
            avatar_url: f.followed.avatar_url,
            is_private: f.followed.is_private,
            cover_image: f.followed.cover_image ?? null,
            isFollowing: viewerFollowingIds.has(f.followed.id),
        }));
        return res.status(200).json({ total, users });
    }
    catch (error) {
        return res.status(500).json({ message: "Internal server error" });
    }
};
exports.default = Following;
