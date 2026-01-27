import { Request, Response } from "express";
import prisma from "../../config/prismaClient";

export const deletePost = async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "Non authentifié" });
    }

    const { postId } = req.params;

    // Check if post exists and belongs to user
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (post.user_id !== req.user.id) {
      return res.status(403).json({ message: "You can only delete your own posts" });
    }

    // Soft delete by setting is_deleted to true
    await prisma.post.update({
      where: { id: postId },
      data: { is_deleted: true },
    });

    return res.status(200).json({
      message: "Post deleted successfully",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error while deleting post" });
  }
};
