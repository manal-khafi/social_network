"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.toggleLike = void 0;
const prismaClient_1 = __importDefault(require("../../config/prismaClient"));
const BlockService_1 = require("../../services/BlockService");
const toggleLike = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { postId, commentId } = req.params;
        const targetPostId = postId || null;
        const targetCommentId = commentId || null;
        if (targetPostId && typeof targetPostId !== 'string') {
            return res.status(400).json({ message: "Invalid postId" });
        }
        if (targetCommentId && typeof targetCommentId !== 'string') {
            return res.status(400).json({ message: "Invalid commentId" });
        }
        if (!targetPostId && !targetCommentId) {
            return res.status(400).json({ message: "postId or commentId is required" });
        }
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        let targetOwnerId = null;
        if (targetPostId) {
            const post = await prismaClient_1.default.post.findUnique({
                where: { id: targetPostId },
                select: { user_id: true }
            });
            if (!post) {
                return res.status(404).json({ message: "Post not found" });
            }
            targetOwnerId = post.user_id;
        }
        else if (targetCommentId) {
            const comment = await prismaClient_1.default.comment.findUnique({
                where: { id: targetCommentId },
                select: { user_id: true }
            });
            if (!comment) {
                return res.status(404).json({ message: "Comment not found" });
            }
            targetOwnerId = comment.user_id;
        }
        if (targetOwnerId && await (0, BlockService_1.isBlockedEitherWay)(userId, targetOwnerId)) {
            return res.status(403).json({ message: "Forbidden" });
        }
        const existingLike = await prismaClient_1.default.like.findFirst({
            where: {
                user_id: userId,
                post_id: targetPostId,
                comment_id: targetCommentId,
            },
        });
        //unlike 
        if (existingLike) {
            await prismaClient_1.default.like.delete({
                where: { id: existingLike.id },
            });
            // Get updated counts
            const post = targetPostId ? await prismaClient_1.default.post.findUnique({
                where: { id: targetPostId },
                select: { _count: { select: { likes: true } } }
            }) : null;
            return res.json({
                liked: false,
                message: 'Post unliked',
                likes: post?._count.likes ?? 0
            });
        }
        //like
        await prismaClient_1.default.like.create({
            data: {
                user_id: userId,
                post_id: targetPostId,
                comment_id: targetCommentId,
            },
        });
        // Get updated counts
        const post = targetPostId ? await prismaClient_1.default.post.findUnique({
            where: { id: targetPostId },
            select: { _count: { select: { likes: true } } }
        }) : null;
        return res.json({
            liked: true,
            message: 'Post liked',
            likes: post?._count.likes ?? 0
        });
    }
    catch (error) {
        res.status(500).json({ message: "something went wrong" });
    }
};
exports.toggleLike = toggleLike;
