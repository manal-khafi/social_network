"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteComment = void 0;
const prismaClient_1 = __importDefault(require("../../config/prismaClient"));
async function collectDescendants(tx, parentIds, collected) {
    if (parentIds.length === 0)
        return;
    const children = await tx.comment.findMany({
        where: { parent_comment_id: { in: parentIds } },
        select: { id: true },
    });
    const childIds = [];
    for (const c of children) {
        if (!collected.has(c.id)) {
            collected.add(c.id);
            childIds.push(c.id);
        }
    }
    await collectDescendants(tx, childIds, collected);
}
const deleteComment = async (req, res) => {
    const { commentId } = req.params;
    const userId = req.user?.id;
    if (typeof commentId !== 'string') {
        return res.status(400).json({ message: "Invalid comment ID" });
    }
    if (!userId)
        return res.status(401).json({ message: "Unauthorized" });
    try {
        const comment = await prismaClient_1.default.comment.findUnique({
            where: { id: commentId },
            include: {
                post: { select: { user_id: true } },
            },
        });
        if (!comment) {
            return res.status(404).json({ message: "Comment not found" });
        }
        const isCommentOwner = comment.user_id === userId;
        const isPostOwner = comment.post.user_id === userId;
        if (!isCommentOwner && !isPostOwner) {
            return res
                .status(403)
                .json({ message: "You are not allowed to delete this comment" });
        }
        const deletedCount = await prismaClient_1.default.$transaction(async (tx) => {
            const ids = new Set([commentId]);
            await collectDescendants(tx, [commentId], ids);
            const idsToDelete = Array.from(ids);
            const del = await tx.comment.deleteMany({
                where: { id: { in: idsToDelete } },
            });
            return del.count;
        });
        return res.status(200).json({ success: true, deletedCount });
    }
    catch (error) {
        console.error("Error deleting comment:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
exports.deleteComment = deleteComment;
