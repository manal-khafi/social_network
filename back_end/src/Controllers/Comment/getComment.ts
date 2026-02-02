import { Request, Response } from "express";
import prisma from "../../config/prismaClient";
import { verifyAccessToken } from "../../util/jwt";

interface CommentNode {
  id: string;
  postId: string;
  userId: string;
  username: string;
  avatar: string | null;
  content: string;
  likes: number;
  isLiked: boolean;
  timestamp: string;
  parent_comment_id: string | null;
  replies: CommentNode[];
}

const buildCommentTree = (
  comments: CommentNode[],
  parentId: string | null = null
): CommentNode[] => {
  return comments
    .filter((comment) => comment.parent_comment_id === parentId)
    .map((comment) => ({
      ...comment,
      replies: buildCommentTree(comments, comment.id),
    }));
};

export const getComment = async (req: Request, res: Response) => {
  const postId = (req.params.postId as string) as string;
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

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { user_id: true }
    }) as any;

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const include: {
      user: { select: { id: true; username: true; display_name: true; avatar_url: true } };
      _count: { select: { likes: true } };
      likes?: { where: { user_id: string }; select: { id: true } };
    } = {
      user: { select: { id: true, username: true, display_name: true, avatar_url: true } },
      _count: { select: { likes: true } },
    };
    if (userId) {
      include.likes = { where: { user_id: userId }, select: { id: true } };
    }

    const comments = await prisma.comment.findMany({
      where: {
        post_id: postId,
        is_deleted: false
      },
      orderBy: { created_at: "asc" },
      include,
    }) as any[];
    const normalized = comments.map((comment: any) => ({
      id: comment.id,
      postId: comment.post_id,
      userId: comment.user_id,
      username: comment.user.username || comment.user.display_name || "Unknown User",
      avatar: comment.user.avatar_url ?? null,
      content: comment.content,
      likes: comment._count.likes ?? 0,
      isLiked: userId ? (comment.likes?.length ?? 0) > 0 : false,
      timestamp: comment.created_at.toISOString(),
      parent_comment_id: comment.parent_comment_id ?? null,
      replies: [],
    }));
    const commentsTree = buildCommentTree(normalized, null);

    res.status(200).json({ postOwnerId: post.user_id, comments: commentsTree });

  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};


export default getComment;
