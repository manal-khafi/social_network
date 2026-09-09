import { Request, Response } from "express";
import prisma from "../../config/prismaClient";
import { verifyAccessToken } from "../../util/jwt";
import { getBlockedUserIds } from "../../services/BlockService"; // Added import

export const getPosts = async (req: Request, res: Response) => {
  try {
    const limitParam = Number(req.query.limit);
    const offsetParam = Number(req.query.offset);
    const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 50) : 5;
    const offset = Number.isFinite(offsetParam) && offsetParam >= 0 ? offsetParam : 0;

    const authHeader = req.headers.authorization;
    let userId: string | null = null;
    let blockedIds: string[] = []; // Initialize blockedIds

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      try {
        const decoded = verifyAccessToken(token) as { id: string };
        userId = decoded.id;
        blockedIds = await getBlockedUserIds(userId); // Retrieve blocked IDs
      } catch {
        userId = null;
      }
    }

    const postInclude: any = {
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
    };

    if (userId) {
      postInclude.likes = { where: { user_id: userId, comment_id: null }, select: { id: true } };
      postInclude.saves = { where: { user_id: userId }, select: { id: true } };
      postInclude.reposts = { where: { user_id: userId }, select: { id: true } };
    }

    const baseWhere = {
      is_deleted: false,
      is_archived: false,
      user_id: {
        notIn: blockedIds, // Filter out posts from blocked users
      },
    };

    let allowedPrivateIds: string[] = [];
    if (userId) {
      const follows = await prisma.follow.findMany({
        where: { follower_id: userId, status: "accepted" },
        select: { followed_id: true },
      });
      allowedPrivateIds = follows.map((f: { followed_id: string }) => f.followed_id);
    }

    const privacyFilter = userId
      ? {
          OR: [
            { user: { is_private: false } },
            { user_id: userId },
            { user_id: { in: allowedPrivateIds } },
          ],
        }
      : { user: { is_private: false } };

    const posts = await prisma.post.findMany({
      where: { ...baseWhere, ...privacyFilter } as any,
      include: postInclude as any,
      orderBy: { created_at: "desc" },
      skip: offset,
      take: limit + 1,
    });

    const hasMore = posts.length > limit;
    const slicedPosts = hasMore ? posts.slice(0, limit) : posts;
    const nextOffset = hasMore ? offset + limit : null;

    const normalizedPosts = (slicedPosts as any[]).map((post) => ({
      id: post.id,
      userId: post.user_id,
      username: post.user.username || post.user.display_name || "Unknown User",
      avatar: post.user.avatar_url ?? undefined,
      content: post.content ?? "",
      images: (post.media_urls as string[] | null) ?? undefined,
      likes: post._count.likes ?? 0,
      comments: post._count.comments ?? 0,
      shares: post._count.reposts ?? post._count.shares ?? 0,
      saves: post._count.saves ?? 0,
      isLiked: userId ? (post.likes?.length ?? 0) > 0 : false,
      isSaved: userId ? (post.saves?.length ?? 0) > 0 : false,
      isReposted: userId ? (post.reposts?.length ?? 0) > 0 : false,
      isArchived: false,
      isEdited: post.updated_at > post.created_at,
      timestamp: post.created_at.toISOString(),

      commentsAllowed: post.user.allow_comments !== false,

      likesVisible: true,
    }));

    return res.status(200).json({ posts: normalizedPosts, nextOffset, hasMore });
  } catch (err) {
    console.error("Error fetching posts:", err);
    return res.status(500).json({ message: "Server error while fetching posts" });
  }
};
