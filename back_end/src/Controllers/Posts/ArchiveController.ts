import { Request, Response } from "express";
import prisma from "../../config/prismaClient";

export const archivePost = async (req: Request, res: Response) => {
  const { postId } = req.params;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post || post.user_id !== userId) {
      return res.status(404).json({ message: "Post not found or not owned" });
    }

    await prisma.post.update({
      where: { id: postId },
      data: { is_archived: true },
    });

    res.json({ success: true, postId });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

export const unarchivePost = async (req: Request, res: Response) => {
  const { postId } = req.params;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post || post.user_id !== userId) {
      return res.status(404).json({ message: "Post not found or not owned" });
    }

    await prisma.post.update({
      where: { id: postId },
      data: { is_archived: false },
    });

    res.json({ success: true, postId });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};
