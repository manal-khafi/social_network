"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deletePost = void 0;
const prismaClient_1 = __importDefault(require("../../config/prismaClient"));
const deletePost = async (req, res) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({ message: "Non authentifié" });
        }
        const { postId } = req.params;
        // Check if post exists and belongs to user
        const post = await prismaClient_1.default.post.findUnique({
            where: { id: postId },
        });
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }
        if (post.user_id !== req.user.id) {
            return res.status(403).json({ message: "You can only delete your own posts" });
        }
        // Soft delete by setting is_deleted to true
        await prismaClient_1.default.post.update({
            where: { id: postId },
            data: { is_deleted: true },
        });
        return res.status(200).json({
            message: "Post deleted successfully",
        });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Server error while deleting post" });
    }
};
exports.deletePost = deletePost;
