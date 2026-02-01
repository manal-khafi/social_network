"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const prismaClient_1 = __importDefault(require("../../config/prismaClient"));
const BlockService_1 = require("../../services/BlockService");
const Comment = async (req, res) => {
    try {
        const { content, parent_comment_id, postId } = req.body;
        const userId = req.user?.id;
        if (!postId) {
            return res.status(400).json({ message: "Post ID is required" });
        }
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const findpost = await prismaClient_1.default.post.findUnique({
            where: { id: postId },
            select: {
                id: true,
                user_id: true,
                user: {
                    select: { allow_comments: true },
                },
            },
        });
        if (!findpost) {
            return res.status(404).json({ message: "Post not found" });
        }
        // Check if the viewer is blocked by the post owner, or vice versa
        const blocked = await (0, BlockService_1.isBlockedEitherWay)(userId, findpost.user_id);
        if (blocked) {
            return res.status(403).json({ message: "You cannot comment on this post." });
        }
        if (findpost.user.allow_comments === false) {
            return res.status(403).json({ message: "Comments are disabled for this post" });
        }
        const finduser = await prismaClient_1.default.user.findUnique({
            where: { id: userId },
            select: { id: true, username: true, display_name: true, avatar_url: true },
        });
        if (!finduser) {
            return res.status(404).json({ message: "User not found" });
        }
        if (!content || String(content).trim().length === 0) {
            return res.status(400).json({ message: "Content is required" });
        }
        const newComment = await prismaClient_1.default.comment.create({
            data: {
                content: String(content).trim(),
                post_id: postId,
                user_id: userId,
                parent_comment_id: parent_comment_id || null,
            },
        });
        return res.status(201).json({
            message: "Comment created successfully",
            comment: {
                id: newComment.id,
                postId: newComment.post_id,
                userId: newComment.user_id,
                username: finduser.username || finduser.display_name || "Unknown User",
                avatar: finduser.avatar_url ?? null,
                content: newComment.content,
                likes: 0,
                isLiked: false,
                timestamp: newComment.created_at.toISOString(),
                replies: [],
                parent_comment_id: newComment.parent_comment_id ?? null,
            },
        });
    }
    catch (error) {
        console.error("Create comment error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
exports.default = Comment;
