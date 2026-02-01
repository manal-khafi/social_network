"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const prismaClient_1 = __importDefault(require("../../config/prismaClient"));
const Follower = async (req, res) => {
    const userId = req.params.userId;
    if (typeof userId !== 'string') {
        return res.status(400).json({ message: "Invalid user ID" });
    }
    const viewerId = req.user?.id;
    try {
        const followers = await prismaClient_1.default.follow.findMany({
            where: {
                followed_id: userId,
                status: "accepted",
            },
            include: {
                follower: true,
            },
            orderBy: { created_at: "desc" },
        });
        const total = await prismaClient_1.default.follow.count({
            where: {
                followed_id: userId,
                status: "accepted",
            },
        });
        const followerIds = followers.map((f) => f.follower.id).filter((id) => id !== undefined);
        let viewerFollowingIds = new Set();
        if (viewerId && followerIds.length > 0) {
            const viewerFollows = await prismaClient_1.default.follow.findMany({
                where: {
                    follower_id: viewerId,
                    followed_id: { in: followerIds },
                    status: "accepted",
                },
                select: { followed_id: true },
            });
            viewerFollowingIds = new Set(viewerFollows.map((f) => f.followed_id));
        }
        const users = followers.map((f) => ({
            id: f.follower.id,
            username: f.follower.username,
            display_name: f.follower.display_name,
            avatar_url: f.follower.avatar_url,
            is_private: f.follower.is_private,
            cover_image: f.follower.cover_image ?? null,
            isFollowing: viewerFollowingIds.has(f.follower.id),
        }));
        res.status(200).json({ total, users });
    }
    catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
};
exports.default = Follower;
