"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getComment = void 0;
const prismaClient_1 = __importDefault(require("../../config/prismaClient"));
const jwt_1 = require("../../util/jwt");
const buildCommentTree = (comments, parentId = null) => {
    return comments
        .filter((comment) => comment.parent_comment_id === parentId)
        .map((comment) => ({
        ...comment,
        replies: buildCommentTree(comments, comment.id),
    }));
};
const getComment = async (req, res) => {
    const postId = req.params.postId;
    try {
        const authHeader = req.headers.authorization;
        let userId = null;
        if (authHeader && authHeader.startsWith("Bearer ")) {
            const token = authHeader.split(" ")[1];
            try {
                const decoded = (0, jwt_1.verifyAccessToken)(token);
                userId = decoded.id;
            }
            catch {
                userId = null;
            }
        }
        const post = await prismaClient_1.default.post.findUnique({
            where: { id: postId },
            select: { user_id: true }
        });
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }
        const include = {
            user: { select: { id: true, username: true, display_name: true, avatar_url: true } },
            _count: { select: { likes: true } },
        };
        if (userId) {
            include.likes = { where: { user_id: userId }, select: { id: true } };
        }
        const comments = await prismaClient_1.default.comment.findMany({
            where: {
                post_id: postId,
                is_deleted: false
            },
            orderBy: { created_at: "asc" },
            include,
        });
        const normalized = comments.map((comment) => ({
            id: comment.id,
            postId: comment.post_id,
            userId: comment.user_id,
            username: comment.user.username || comment.user.display_name || "Unknown User",
            avatar: comment.user.avatar_url ?? null,
            content: comment.content,
            likes: comment._count.likes ?? 0,
            isLiked: userId ? (comment.likes?.length ?? 0) > 0 : false,
            timestamp: comment.created_at.toISOString(),
            parent_comment_id: comment.parent_comment_id ?? null,
            replies: [],
        }));
        const commentsTree = buildCommentTree(normalized, null);
        res.status(200).json({ postOwnerId: post.user_id, comments: commentsTree });
    }
    catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
};
exports.getComment = getComment;
exports.default = exports.getComment;
