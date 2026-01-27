import { Request, Response } from "express";
import prisma from "../../config/prismaClient";

export const getMyPosts = async (req: Request, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const posts = await prisma.post.findMany({
      where: {
        user_id: userId,
        is_deleted: false, 
      },
      orderBy: { created_at: "desc" },
      include: {
        user: {
          select: { id: true, username: true, avatar_url: true },
        },

        _count: {
          select: {
            comments: true,
            likes: true,
            reposts: true,
            saves: true,
            shares: true, 
          },
        },

        likes: {
          where: { user_id: userId },
          select: { id: true },
          take: 1,
        },

        saves: {
          where: { user_id: userId },
          select: { id: true },
          take: 1,
        },
        reposts: {
          where: { user_id: userId },
          select: { id: true },
          take: 1,
        },

        shares: {
          where: { user_id: userId },
          select: { id: true },
          take: 1,
        },
      },
    });

    const formatted = posts.map((p) => {
      const images =
        Array.isArray(p.media_urls)
          ? (p.media_urls as unknown as string[])
          : [];

      return {
        id: p.id,
        userId: p.user_id,
        username: p.user.username,
        avatar: p.user.avatar_url,
        content: p.content ?? "",
        images,
        likes: p._count.likes,
        comments: p._count.comments,
        shares: p._count.reposts,
        saves: p._count.saves,
        isLiked: p.likes.length > 0,
        isSaved: p.saves.length > 0,
        isReposted: p.reposts.length > 0,
        sharedCount: p._count.shares,
        isShared: p.shares.length > 0,
        isArchived: false,
        isEdited: false,
        commentsAllowed: true,
        likesVisible: true,

        timestamp: p.created_at,
      };
    });

    return res.status(200).json({ success: true, posts: formatted });
  } catch (error) {
    console.error("Error fetching user's posts:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
