"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPosts = void 0;
const prismaClient_1 = __importDefault(require("../../config/prismaClient"));
const jwt_1 = require("../../util/jwt");
const BlockService_1 = require("../../Service/BlockService"); // Added import
const getPosts = async (req, res) => {
    try {
        const limitParam = Number(req.query.limit);
        const offsetParam = Number(req.query.offset);
        const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 50) : 5;
        const offset = Number.isFinite(offsetParam) && offsetParam >= 0 ? offsetParam : 0;
        const authHeader = req.headers.authorization;
        let userId = null;
        let blockedIds = []; // Initialize blockedIds
        if (authHeader && authHeader.startsWith("Bearer ")) {
            const token = authHeader.split(" ")[1];
            try {
                const decoded = (0, jwt_1.verifyAccessToken)(token);
                userId = decoded.id;
                blockedIds = await (0, BlockService_1.getBlockedUserIds)(userId); // Retrieve blocked IDs
            }
            catch {
                userId = null;
            }
        }
        const postInclude = {
            user: { select: { id: true, username: true, display_name: true, avatar_url: true, allow_comments: true } },
            _count: { select: { likes: true, comments: true, shares: true, saves: true, reposts: true } },
        };
        if (userId) {
            postInclude.likes = { where: { user_id: userId, comment_id: null }, select: { id: true } };
            postInclude.saves = { where: { user_id: userId }, select: { id: true } };
            postInclude.reposts = { where: { user_id: userId }, select: { id: true } };
        }
        const baseWhere = {
            is_deleted: false,
            visibility: "public",
            is_archived: false,
            user_id: {
                notIn: blockedIds, // Filter out posts from blocked users
            },
        };
        let allowedPrivateIds = [];
        if (userId) {
            const follows = await prismaClient_1.default.follow.findMany({
                where: { follower_id: userId, status: "accepted" },
                select: { followed_id: true },
            });
            allowedPrivateIds = follows.map((f) => f.followed_id);
        }
        const privacyFilter = userId
            ? {
                OR: [
                    { user: { is_private: false } },
                    { user_id: userId },
                    { user_id: { in: allowedPrivateIds } },
                ],
            }
            : { user: { is_private: false } };
        const posts = await prismaClient_1.default.post.findMany({
            where: { ...baseWhere, ...privacyFilter },
            include: postInclude,
            orderBy: { created_at: "desc" },
            skip: offset,
            take: limit + 1,
        });
        const hasMore = posts.length > limit;
        const slicedPosts = hasMore ? posts.slice(0, limit) : posts;
        const nextOffset = hasMore ? offset + limit : null;
        const normalizedPosts = slicedPosts.map((post) => ({
            id: post.id,
            userId: post.user_id,
            username: post.user.username || post.user.display_name || "Unknown User",
            avatar: post.user.avatar_url ?? undefined,
            content: post.content ?? "",
            images: post.media_urls ?? undefined,
            likes: post._count.likes ?? 0,
            comments: post._count.comments ?? 0,
            shares: post._count.reposts ?? post._count.shares ?? 0,
            saves: post._count.saves ?? 0,
            isLiked: userId ? (post.likes?.length ?? 0) > 0 : false,
            isSaved: userId ? (post.saves?.length ?? 0) > 0 : false,
            isReposted: userId ? (post.reposts?.length ?? 0) > 0 : false,
            isArchived: false,
            isEdited: post.updated_at > post.created_at,
            timestamp: post.created_at.toISOString(),
            commentsAllowed: post.user.allow_comments !== false,
            likesVisible: true,
        }));
        return res.status(200).json({ posts: normalizedPosts, nextOffset, hasMore });
    }
    catch (err) {
        console.error("Error fetching posts:", err);
        return res.status(500).json({ message: "Server error while fetching posts" });
    }
};
exports.getPosts = getPosts;
