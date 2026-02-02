import prisma from "../../config/prismaClient";
import { Request, Response } from "express";

export const modifierComment = async (req: Request, res: Response) => {
    try {
        const commentId = (req.params.commentId as string) as string;
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

        const comment = await prisma.comment.findUnique({
            where: { id: commentId }
        });

        if (!comment || comment.is_deleted) {
            return res.status(404).json({ message: 'Comment not found or already deleted' });
        }

        if (comment.user_id !== userId) {
            return res.status(403).json({ message: 'You are not allowed to modify this comment' });
        }

        const updatedComment = await prisma.comment.update({
            where: { id: commentId },
            data: { content: content.trim() },
            select: {
                id: true,
                content: true,
                updated_at: true,
            }
        });

        return res.status(200).json({ success: true, comment: updatedComment });
    } catch (error) {
        console.error("Error modifying comment:", error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
}

export default modifierComment;
