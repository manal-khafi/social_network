import { Response } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthRequest } from "../../types/AuthRequest";

const prisma = new PrismaClient();

export const deleteComment = async (req: AuthRequest, res: Response) => {
  const commentId = req.params.commentId;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId }
    });

    if (!comment || comment.is_deleted) {
      return res.status(404).json({ message: "Comment not found or already deleted" });
    }
    if (comment.user_id !== userId) {
      return res.status(403).json({ message: "You are not allowed to delete this comment" });
    }

    await prisma.comment.update({
      where: { id: commentId },
      data: { is_deleted: true }
    });

    res.status(200).json({ message: "Comment deleted successfully" });

  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};
