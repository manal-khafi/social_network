import { Request, Response } from "express";
import prisma from "../../config/prismaClient";
import { isBlockedEitherWay } from "../../Service/BlockService";
import { createNotification } from "../../Service/notificationService";
import { emitNotificationNew } from "../../Service/notificationRealtime";

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

    // Check if the viewer is blocked by the post owner, or vice versa
    if (await isBlockedEitherWay(userId, post.user_id)) {
      return res.status(403).json({ message: "Forbidden" });
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

    // Notify post owner
    if (post.user_id && post.user_id !== userId) {
      try {
        const notif = await createNotification({
          userId: post.user_id,
          code: "POST_REPOSTED",
          title: "Post reposted",
          message: "reposted your post",
          senderId: userId,
          sourceId: postId,
          sourceType: "post",
          metadata: { postId },
        });
        await emitNotificationNew({
          receiverId: post.user_id,
          kind: "repost",
          notification: notif,
          extra: { postId },
        });
      } catch {
        // ignore
      }
    }

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
