"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.modifierComment = void 0;
const prismaClient_1 = __importDefault(require("../../config/prismaClient"));
const modifierComment = async (req, res) => {
    try {
        const { commentId } = req.params;
        const { content } = req.body;
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        if (!content || typeof content !== 'string' || content.trim().length === 0) {
            return res.status(400).json({ message: "Content is required" });
        }
        if (content.trim().length > 1000) {
            return res.status(400).json({ message: "Content must be less than 1000 characters" });
        }
        const comment = await prismaClient_1.default.comment.findUnique({
            where: { id: commentId }
        });
        if (!comment || comment.is_deleted) {
            return res.status(404).json({ message: 'Comment not found or already deleted' });
        }
        if (comment.user_id !== userId) {
            return res.status(403).json({ message: 'You are not allowed to modify this comment' });
        }
        const updatedComment = await prismaClient_1.default.comment.update({
            where: { id: commentId },
            data: { content: content.trim() },
            select: {
                id: true,
                content: true,
                updated_at: true,
            }
        });
        return res.status(200).json({ success: true, comment: updatedComment });
    }
    catch (error) {
        console.error("Error modifying comment:", error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};
exports.modifierComment = modifierComment;
exports.default = exports.modifierComment;
