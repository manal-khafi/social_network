import { Request, Response } from "express";
import prisma from "../../config/prismaClient";
import { getBlockedUserIds, isBlockedEitherWay } from "../../Service/BlockService";

const canViewUserContent = async (viewerId: string, targetUserId: string) => {
  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { is_private: true, is_active: true },
  });

  if (!targetUser || !targetUser.is_active) {
    return { allowed: false, reason: "not_found" as const };
  }

  if (await isBlockedEitherWay(viewerId, targetUserId)) {
    return { allowed: false, reason: "blocked" as const };
  }

  if (!targetUser.is_private || viewerId === targetUserId) {
    return { allowed: true };
  }

  const isFollower = await prisma.follow.findFirst({
    where: {
      follower_id: viewerId,
      followed_id: targetUserId,
      status: "accepted",
    },
    select: { id: true },
  });

  return { allowed: !!isFollower, reason: "private" as const };
};

export const getUserPosts = async (req: Request, res: Response) => {
  const viewerId = req.user?.id;
  const { userId } = req.params;

  if (!viewerId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const permission = await canViewUserContent(viewerId, userId);
  if (!permission.allowed) {
    return res.status(permission.reason === "private" ? 403 : 404).json({
      message: permission.reason === "private" ? "This profile is private" : "User not found",
    });
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
          select: { id: true, username: true, avatar_url: true, allow_comments: true },
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
          where: { user_id: viewerId, comment_id: null },
          select: { id: true },
          take: 1,
        },
        saves: {
          where: { user_id: viewerId },
          select: { id: true },
          take: 1,
        },
        reposts: {
          where: { user_id: viewerId },
          select: { id: true },
          take: 1,
        },
        shares: {
          where: { user_id: viewerId },
          select: { id: true },
          take: 1,
        },
      },
    });

    const formatted = posts.map((p) => {
      const images = Array.isArray(p.media_urls)
        ? (p.media_urls as unknown as string[])
        : [];

      return {
        id: p.id,
        userId: p.user_id,
        username: p.user.username,
        avatar: p.user.avatar_url ?? undefined,
        content: p.content ?? "",
        images,
        likes: p._count.likes ?? 0,
        comments: p._count.comments ?? 0,
        shares: p._count.reposts ?? 0,
        saves: p._count.saves ?? 0,
        isLiked: (p.likes?.length ?? 0) > 0,
        isSaved: (p.saves?.length ?? 0) > 0,
        isReposted: (p.reposts?.length ?? 0) > 0,
        sharedCount: p._count.shares ?? 0,
        isShared: (p.shares?.length ?? 0) > 0,
        isArchived: false,
        isEdited: p.updated_at > p.created_at,
        commentsAllowed: p.user.allow_comments ?? true,
        likesVisible: true,
        timestamp: p.created_at.toISOString(),
      };
    });

    return res.status(200).json({ success: true, posts: formatted });
  } catch (error) {
    console.error("Error fetching user's posts:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getUserReposts = async (req: Request, res: Response) => {
  const viewerId = req.user?.id;
  const { userId } = req.params;

  if (!viewerId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const permission = await canViewUserContent(viewerId, userId);
  if (!permission.allowed) {
    return res.status(permission.reason === "private" ? 403 : 404).json({
      message: permission.reason === "private" ? "This profile is private" : "User not found",
    });
  }

  try {
    const blockedIds = await getBlockedUserIds(viewerId);

    const reposts = await prisma.repost.findMany({
      where: {
        user_id: userId,
        originalPost: {
          user_id: { notIn: blockedIds },
        },
      },
      orderBy: { created_at: "desc" },
      include: {
        originalPost: {
          include: {
            user: {
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
              where: { user_id: viewerId, comment_id: null },
              select: { id: true },
              take: 1,
            },
            saves: {
              where: { user_id: viewerId },
              select: { id: true },
              take: 1,
            },
            reposts: {
              where: { user_id: viewerId },
              select: { id: true },
              take: 1,
            },
          },
        },
      },
    });

    const formatted = reposts.map((r) => {
      const p = r.originalPost;
      const images = Array.isArray(p.media_urls)
        ? (p.media_urls as unknown as string[])
        : [];

      return {
        id: p.id,
        userId: p.user_id,
        username: p.user.username,
        avatar: p.user.avatar_url ?? undefined,
        content: p.content ?? "",
        images,
        likes: p._count.likes ?? 0,
        comments: p._count.comments ?? 0,
        shares: p._count.reposts ?? 0,
        saves: p._count.saves ?? 0,
        isLiked: (p.likes?.length ?? 0) > 0,
        isSaved: (p.saves?.length ?? 0) > 0,
        isReposted: (p.reposts?.length ?? 0) > 0,
        isArchived: false,
        isEdited: p.updated_at > p.created_at,
        commentsAllowed: p.user.allow_comments ?? true,
        likesVisible: true,
        timestamp: r.created_at.toISOString(),
        originalPost: {
          id: p.id,
          username: p.user.username,
          content: p.content ?? "",
        },
      };
    });

    return res.status(200).json({ success: true, reposts: formatted });
  } catch (error) {
    console.error("Error fetching user's reposts:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
