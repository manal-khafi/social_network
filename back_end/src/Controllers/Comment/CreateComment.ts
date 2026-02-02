import { Request, Response } from "express";
import prisma from "../../config/prismaClient";
import { isBlockedEitherWay } from "../../Service/BlockService";
import { createNotification } from "../../Service/notificationService";
import { emitNotificationNew } from "../../Service/notificationRealtime";

const extractMentions = (text: string) => {
  const out = new Set<string>();
  const re = /@([a-zA-Z0-9_]{2,30})/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    out.add(m[1]);
  }
  return Array.from(out);
};

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

    if (!findpost) {
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

    const newComment = await prisma.comment.create({
      data: {
        content: String(content).trim(),
        post_id: postId,
        user_id: userId,
        parent_comment_id: parent_comment_id || null,
      },
    });

    // --- Notifications (post owner / parent comment owner) ---
    try {
      const sender = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, username: true, display_name: true },
      });
      const senderName = sender?.display_name || sender?.username || "Someone";

      if (newComment.parent_comment_id) {
        const parent = await prisma.comment.findUnique({
          where: { id: newComment.parent_comment_id },
          select: { user_id: true },
        });
        const receiverId = parent?.user_id;
        if (receiverId && receiverId !== userId) {
          const notif = await createNotification({
            userId: receiverId,
            code: "COMMENT_REPLIED",
            title: "New reply",
            message: "replied to your comment",
            senderId: userId,
            sourceId: newComment.id,
            sourceType: "comment",
            metadata: { postId, commentId: newComment.id, parentCommentId: newComment.parent_comment_id },
          });
          await emitNotificationNew({
            receiverId,
            kind: "comment",
            notification: notif,
            extra: { postId, commentId: newComment.id },
          });
        }
      } else {
        const receiverId = findpost.user_id;
        if (receiverId && receiverId !== userId) {
          const notif = await createNotification({
            userId: receiverId,
            code: "POST_COMMENTED",
            title: "New comment",
            message: "commented on your post",
            senderId: userId,
            sourceId: postId,
            sourceType: "post",
            metadata: { postId, commentId: newComment.id },
          });
          await emitNotificationNew({
            receiverId,
            kind: "comment",
            notification: notif,
            extra: { postId, commentId: newComment.id },
          });
        }
      }

      // Mentions inside comment
      const mentions = extractMentions(String(content));
      if (mentions.length) {
        const mentionedUsers = await prisma.user.findMany({
          where: { username: { in: mentions } },
          select: { id: true },
        });

        for (const u of mentionedUsers) {
          if (u.id === userId) continue;
          const notif = await createNotification({
            userId: u.id,
            code: "COMMENT_MENTION",
            title: "Mention",
            message: `${senderName} mentioned you in a comment`,
            senderId: userId,
            sourceId: newComment.id,
            sourceType: "comment",
            metadata: { postId, commentId: newComment.id },
          });
          await emitNotificationNew({
            receiverId: u.id,
            kind: "mention",
            notification: notif,
            extra: { postId, commentId: newComment.id },
          });
        }
      }
    } catch {
      // do not block comment creation
    }

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

