import { Request, Response } from "express";
import prisma from "../../config/prismaClient";

export const toggleRepost = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { postId } = req.params;

    if (!userId) {
      return res.status(401).json({ message: "Non authentifié" });
    }

    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const existingRepost = await prisma.repost.findFirst({
      where: { user_id: userId, original_post_id: postId },
    });

    if (existingRepost) {
      await prisma.repost.delete({ where: { id: existingRepost.id } });
      
      const updatedPost = await prisma.post.findUnique({
        where: { id: postId },
        include: { _count: { select: { reposts: true, shares: true } } }
      });
      
      return res.json({ 
        reposted: false, 
        shares: (updatedPost?._count.reposts ?? 0) + (updatedPost?._count.shares ?? 0)
      });
    }

    await prisma.repost.create({
      data: { user_id: userId, original_post_id: postId },
    });

    const updatedPost = await prisma.post.findUnique({
      where: { id: postId },
      include: { _count: { select: { reposts: true, shares: true } } }
    });

    return res.json({ 
      reposted: true, 
      shares: (updatedPost?._count.reposts ?? 0) + (updatedPost?._count.shares ?? 0)
    });
  } catch (error) {
    return res.status(500).json({ message: "Something went wrong" });
  }
};
