import { Request, Response } from "express";
import prisma from "../../config/prismaClient";

export const getMyArchivedPosts = async (req: Request, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const archivedPosts = await prisma.post.findMany({
      where: {
        user_id: userId,
        is_archived: true,
        is_deleted: false,
      },
      orderBy: {
        updated_at: "desc",
      },
      include: {
        user: {
          // ✅ include allow_comments
          select: { id: true, username: true, avatar_url: true, allow_comments: true },
        },
        _count: {
          select: {
            comments: true,
            likes: true,
            reposts: true,
            saves: true,
          },
        },
        likes: {
          where: { user_id: userId, comment_id: null },
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
      },
    });

    const formatted = archivedPosts.map((p) => {
      const images = Array.isArray(p.media_urls) ? (p.media_urls as unknown as string[]) : [];

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

        isArchived: true,
        isEdited: p.updated_at > p.created_at,

        commentsAllowed: p.user.allow_comments !== false,

        likesVisible: true,
        timestamp: p.updated_at.toISOString(),
      };
    });

    return res.status(200).json({ success: true, posts: formatted });
  } catch (error) {
    console.error("Error fetching user's archived posts:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
