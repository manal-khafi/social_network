import { Request, Response } from "express";
import prisma from "../../config/prismaClient";
import { getBlockedUserIds } from "../../services/BlockService";
import { visiblePostWhere } from "../../services/postVisibility";

export const getMyLikedPosts = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const blockedIds = await getBlockedUserIds(userId!); // Retrieve blocked IDs

    const likedPosts = await prisma.like.findMany({
      where: {
        user_id: userId,
        post_id: { not: null },
        post: {
          user_id: { notIn: blockedIds }, // Filter out liked posts from blocked users
          AND: [visiblePostWhere(userId)],
        },
      },
      include: {
        post: {
          include: {
            user: {
              select: {
                id: true,
                display_name: true,
                username: true,
                avatar_url: true,
              },
            },
            _count: {
              select: {
                likes: true,
                comments: { where: { is_deleted: false } },
              },
            },
          },
        },
      },
      orderBy: { created_at: "desc" },
    });

    const result = likedPosts
      .filter((like) => like.post) 
      .map((like) => {
        const p = like.post!;
        return {
          id: p.id,
          content: p.content,
          images: Array.isArray(p.media_urls) ? p.media_urls : [], 
          userId: p.user_id,                          
          username: p.user?.username ?? "Unknown",    
          avatar: p.user?.avatar_url ?? "",           
          display_name: p.user?.display_name ?? "",

          timestamp: p.created_at,                   
          isEdited: p.updated_at?.getTime() !== p.created_at.getTime(),

          likes: p._count?.likes ?? 0,
          comments: p._count?.comments ?? 0,

          isLiked: true,
          isSaved: false,
          isReposted: false,
          likesVisible: true,
          commentsAllowed: true,
          shares: 0,

          originalPost: null,
        };
      });

    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ message: "Erreur serveur" });
  }
};

