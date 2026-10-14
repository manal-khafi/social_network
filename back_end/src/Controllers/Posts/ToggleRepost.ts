import { Request, Response } from "express";
import { NotificationService } from "../../services/notificationService";
import { canViewPost } from "../../services/postVisibility";
import prisma from "../../config/prismaClient";
import { isBlockedEitherWay } from "../../services/BlockService";

export const toggleRepost = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { postId } = req.params as { [key: string]: string };

    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post || !(await canViewPost(userId, postId))) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Check if the viewer is blocked by the post owner, or vice versa
    if (await isBlockedEitherWay(userId, post.user_id)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const existingRepost = await prisma.repost.findFirst({
      where: { user_id: userId, original_post_id: postId },
    });

    if (existingRepost) {
      await prisma.repost.delete({ where: { id: existingRepost.id } });

      // Withdraw the "reposted your post" notification.
      NotificationService.removeNotification("repost", userId, postId);
      
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

    NotificationService.notify("repost", {
      recipientId: post.user_id,
      actorId: userId,
      sourceId: postId,
      sourceType: "post",
      metadata: { post_id: postId },
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
