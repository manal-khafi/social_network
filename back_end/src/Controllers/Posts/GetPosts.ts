import { Request, Response } from "express";
import prisma from "../../config/prismaClient";
import { verifyAccessToken } from "../../util/jwt";

export const getPosts = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    let userId: string | null = null;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      try {
        const decoded = verifyAccessToken(token) as { id: string };
        userId = decoded.id;
      } catch {
        userId = null;
      }
    }

    const include: {
      user: {
        select: { id: true; username: true; display_name: true; avatar_url: true };
      };
      _count: {
        select: { likes: true; comments: true; shares: true; saves: true; reposts: true };
      };
      likes?: { where: { user_id: string; comment_id: null }; select: { id: true } };
      saves?: { where: { user_id: string }; select: { id: true } };
      reposts?: { where: { user_id: string }; select: { id: true } };
    } = {
      user: { select: { id: true, username: true, display_name: true, avatar_url: true } },
      _count: { select: { likes: true, comments: true, shares: true, saves: true, reposts: true } },
    };

    if (userId) {
      include.likes = { where: { user_id: userId, comment_id: null }, select: { id: true } };
      include.saves = { where: { user_id: userId }, select: { id: true } };
      include.reposts = { where: { user_id: userId }, select: { id: true } };
    }

    const posts = await prisma.post.findMany({
      where: { is_deleted: false, visibility: "public", is_archived: false },
      include,
      orderBy: { created_at: "desc" },
    });

    const normalizedPosts = posts.map((post: typeof posts[number]) => ({
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
      commentsAllowed: true,
      likesVisible: true,
    }));

    return res.status(200).json({ posts: normalizedPosts });
  } catch (err) {
    console.error("Error fetching posts:", err);
    return res.status(500).json({ message: "Server error while fetching posts" });
  }
};
