"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePost = void 0;
const prismaClient_1 = __importDefault(require("../../config/prismaClient"));
const updatePost = async (req, res) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({ message: "Non authentifié" });
        }
        const { postId } = req.params;
        if (typeof postId !== 'string') {
            return res.status(400).json({ message: "Invalid post ID" });
        }
        const { content, media_urls } = req.body;
        // Check if post exists and belongs to user
        const post = await prismaClient_1.default.post.findUnique({
            where: { id: postId },
        });
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }
        if (post.user_id !== req.user.id) {
            return res.status(403).json({ message: "You can only edit your own posts" });
        }
        // Update post
        const updatedPost = await prismaClient_1.default.post.update({
            where: { id: postId },
            data: {
                content: content !== undefined ? content.trim() : undefined,
                media_urls: media_urls !== undefined ? media_urls : undefined,
                updated_at: new Date(),
            },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        display_name: true,
                        avatar_url: true,
                    },
                },
                _count: {
                    select: {
                        likes: true,
                        comments: { where: { is_deleted: false } },
                        shares: true,
                        saves: true,
                    },
                },
            },
        });
        const normalizedPost = {
            id: updatedPost.id,
            userId: updatedPost.user_id,
            username: updatedPost.user.username || updatedPost.user.display_name || "Unknown User",
            avatar: updatedPost.user.avatar_url ?? undefined,
            content: updatedPost.content ?? "",
            images: updatedPost.media_urls ?? undefined,
            likes: updatedPost._count.likes ?? 0,
            comments: updatedPost._count.comments ?? 0,
            shares: updatedPost._count.shares ?? 0,
            saves: updatedPost._count.saves ?? 0,
            isLiked: false,
            isSaved: false,
            isReposted: false,
            isArchived: false,
            isEdited: updatedPost.updated_at > updatedPost.created_at,
            timestamp: updatedPost.created_at.toISOString(),
            commentsAllowed: true,
            likesVisible: true,
        };
        return res.status(200).json({
            message: "Post updated successfully",
            post: normalizedPost,
        });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Server error while updating post" });
    }
};
exports.updatePost = updatePost;
