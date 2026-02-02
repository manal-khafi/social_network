import { Request, Response } from "express";
import prisma from "../../config/prismaClient";
import { isBlockedEitherWay } from "../../services/BlockService";

export const toggleSave = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { postId } = req.params as { [key: string]: string };

    if (!userId) {
      return res.status(401).json({ message: "Non authentifié" });
    }

    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Check if the viewer is blocked by the post owner, or vice versa
    if (await isBlockedEitherWay(userId, post.user_id)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const existingSave = await prisma.save.findFirst({
      where: { user_id: userId, post_id: postId },
    });

    if (existingSave) {
      await prisma.save.delete({ where: { id: existingSave.id } });
      
      const updatedPost = await prisma.post.findUnique({
        where: { id: postId },
        include: { _count: { select: { saves: true } } }
      });
      
      return res.json({ saved: false, saves: updatedPost?._count.saves ?? 0 });
    }

    await prisma.save.create({
      data: { user_id: userId, post_id: postId },
    });

    const updatedPost = await prisma.post.findUnique({
      where: { id: postId },
      include: { _count: { select: { saves: true } } }
    });

    return res.json({ saved: true, saves: updatedPost?._count.saves ?? 0 });
  } catch (error) {
    return res.status(500).json({ message: "Something went wrong" });
  }
};
