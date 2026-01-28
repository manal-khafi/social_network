import { Request, Response } from "express";
import prisma from "../../config/prismaClient";

export const deleteComment = async (req: Request, res: Response) => {
  const commentId = req.params.commentId;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        post: {
          select: {
            user_id: true,
          },
        },
      },
    });

    if (!comment || comment.is_deleted) {
      return res.status(404).json({ message: "Comment not found or already deleted" });
    }

    const isCommentOwner = comment.user_id === userId;
    const isPostOwner = comment.post.user_id === userId;

    if (!isCommentOwner && !isPostOwner) {
      return res.status(403).json({ message: "You are not allowed to delete this comment" });
    }

    await prisma.comment.update({
      where: { id: commentId },
      data: { is_deleted: true },
    });

    res.status(200).json({ success: true, commentId });

  } catch (error) {
    console.error("Error deleting comment:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
