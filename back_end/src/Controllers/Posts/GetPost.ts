import { Request, Response } from "express";
import prisma from "../../config/prismaClient";
import { verifyAccessToken } from "../../util/jwt";
import { getBlockedUserIds } from "../../services/BlockService";
import { visiblePostWhere } from "../../services/postVisibility";

/**
 * GET /api/posts/:postId - one post, shaped like the feed items. Used to open
 * the post a notification (like, comment, mention...) is about. Same rules as
 * the feed: visibility, private accounts and blocks; archived posts only for
 * their author.
 */
export const getPost = async (req: Request, res: Response) => {
  try {
    const postId = req.params.postId as string;

    let userId: string | null = null;
    let blockedIds: string[] = [];
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      try {
        userId = (verifyAccessToken(authHeader.split(" ")[1]) as { id: string }).id;
        blockedIds = await getBlockedUserIds(userId);
      } catch {
        userId = null;
      }
    }

    const post: any = await prisma.post.findFirst({
      where: {
        id: postId,
        user_id: { notIn: blockedIds },
        AND: [
          visiblePostWhere(userId),
          { OR: [{ is_archived: false }, ...(userId ? [{ user_id: userId }] : [])] },
        ],
      },
      include: {
        user: { select: { id: true, username: true, display_name: true, avatar_url: true, allow_comments: true } },
        _count: {
          select: {
            likes: true,
            comments: { where: { is_deleted: false } },
            shares: true,
            saves: true,
            reposts: true,
          },
        },
        ...(userId && {
          likes: { where: { user_id: userId, comment_id: null }, select: { id: true } },
          saves: { where: { user_id: userId }, select: { id: true } },
          reposts: { where: { user_id: userId }, select: { id: true } },
        }),
      },
    });

    if (!post) return res.status(404).json({ message: "Post not found" });

    return res.status(200).json({
      post: {
        id: post.id,
        userId: post.user_id,
        username: post.user.username || post.user.display_name || "Unknown User",
        avatar: post.user.avatar_url ?? undefined,
        content: post.content ?? "",
        images: (post.media_urls as string[] | null) ?? undefined,
        visibility: post.visibility,
        likes: post._count.likes ?? 0,
        comments: post._count.comments ?? 0,
        shares: post._count.reposts ?? post._count.shares ?? 0,
        saves: post._count.saves ?? 0,
        isLiked: userId ? (post.likes?.length ?? 0) > 0 : false,
        isSaved: userId ? (post.saves?.length ?? 0) > 0 : false,
        isReposted: userId ? (post.reposts?.length ?? 0) > 0 : false,
        isArchived: post.is_archived,
        isEdited: post.updated_at > post.created_at,
        timestamp: post.created_at.toISOString(),
        commentsAllowed: post.user.allow_comments !== false,
        likesVisible: true,
      },
    });
  } catch (err) {
    console.error("Error fetching post:", err);
    return res.status(500).json({ message: "Server error while fetching the post" });
  }
};
