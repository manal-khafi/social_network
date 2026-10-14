import { Request, Response } from "express";
import { NotificationService } from "../../services/notificationService";
import { canViewPost } from "../../services/postVisibility";
import prisma from "../../config/prismaClient";
import { isBlockedEitherWay } from "../../services/BlockService";

const Comment = async (req: Request, res: Response) => {
  try {
    const { content, parent_comment_id, postId } = req.body;
    const userId = req.user?.id;

    if (!postId) {
      return res.status(400).json({ message: "Post ID is required" });
    }
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const findpost = await prisma.post.findUnique({
      where: { id: postId },
      select: {
        id: true,
        user_id: true,
        user: {
          select: { allow_comments: true },
        },
      },
    });

    if (!findpost || !(await canViewPost(userId, postId))) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Check if the viewer is blocked by the post owner, or vice versa
    const blocked = await isBlockedEitherWay(userId, findpost.user_id);
    if (blocked) {
      return res.status(403).json({ message: "You cannot comment on this post." });
    }

    if (findpost.user.allow_comments === false) {
      return res.status(403).json({ message: "Comments are disabled for this post" });
    }

    const finduser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, display_name: true, avatar_url: true },
    });

    if (!finduser) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!content || String(content).trim().length === 0) {
      return res.status(400).json({ message: "Content is required" });
    }

    // A reply must point at an existing comment of the same post.
    let parentComment: { id: string; user_id: string } | null = null;
    if (parent_comment_id) {
      parentComment = await prisma.comment.findFirst({
        where: { id: String(parent_comment_id), post_id: postId, is_deleted: false },
        select: { id: true, user_id: true },
      });
      if (!parentComment) {
        return res.status(400).json({ message: "Parent comment not found" });
      }
    }

    const newComment = await prisma.comment.create({
      data: {
        content: String(content).trim(),
        post_id: postId,
        user_id: userId,
        parent_comment_id: parentComment?.id ?? null,
      },
    });

    NotificationService.notify("comment", {
      recipientId: findpost.user_id,
      actorId: userId,
      sourceId: postId,
      sourceType: "post",
      metadata: { post_id: postId, comment_id: newComment.id },
    });
    // Reply: also tell the parent comment's author, unless that is the post
    // author (already covered by the "comment" notification above). Replying
    // to yourself is skipped by the service.
    const notifyParentAuthor = !!parentComment && parentComment.user_id !== findpost.user_id;
    if (parentComment && notifyParentAuthor) {
      NotificationService.notify("reply", {
        recipientId: parentComment.user_id,
        actorId: userId,
        sourceId: parentComment.id,
        sourceType: "comment",
        metadata: { post_id: postId, comment_id: newComment.id, parent_comment_id: parentComment.id },
      });
    }
    NotificationService.notifyMentions({
      actorId: userId,
      content: newComment.content,
      postId,
      commentId: newComment.id,
      excludeUserIds: [
        findpost.user_id,
        ...(parentComment && notifyParentAuthor ? [parentComment.user_id] : []),
      ],
    });

    return res.status(201).json({
      message: "Comment created successfully",
      comment: {
        id: newComment.id,
        postId: newComment.post_id,
        userId: newComment.user_id,
        username: finduser.username || finduser.display_name || "Unknown User",
        avatar: finduser.avatar_url ?? null,
        content: newComment.content,
        likes: 0,
        isLiked: false,
        timestamp: newComment.created_at.toISOString(),
        replies: [],
        parent_comment_id: newComment.parent_comment_id ?? null,
      },
    });
  } catch (error) {
    console.error("Create comment error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export default Comment;

