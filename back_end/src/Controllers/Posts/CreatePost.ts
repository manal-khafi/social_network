import { Request, Response } from "express";
import prisma from "../../config/prismaClient";
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

export const createPost = async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "Non authentifié" });
    }

    const { content, media_urls, visibility } = req.body;
    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return res.status(400).json({ message: "Content is required and cannot be empty" });
    }

    if (media_urls && !Array.isArray(media_urls)) {
      return res.status(400).json({ message: "media_urls must be an array of strings" });
    }

    if (media_urls && !media_urls.every((m: string) => typeof m === "string")) {
      return res.status(400).json({ message: "Each media URL must be a string" });
    }

    const allowedVisibilities = ["public", "private", "friends"];
    if (visibility && !allowedVisibilities.includes(visibility)) {
      return res.status(400).json({ message: "Invalid visibility value" });
    }
    const post = await prisma.post.create({
      data: {
        content: content.trim(),
        media_urls: media_urls ?? null,
        visibility: (visibility || "public") as "public" | "private" | "friends",
        user_id: req.user.id,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            display_name: true,
            avatar_url: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: { where: { is_deleted: false } },
            shares: true,
            saves: true,
          },
        },
      },
    });

    const normalizedPost = {
      id: post.id,
      userId: post.user_id,
      username: post.user.username || post.user.display_name || "Unknown User",
      avatar: post.user.avatar_url ?? undefined,
      content: post.content ?? "",
      images: (post.media_urls as string[] | null) ?? undefined,
      likes: post._count.likes ?? 0,
      comments: post._count.comments ?? 0,
      shares: post._count.shares ?? 0,
      saves: post._count.saves ?? 0,
      isLiked: false,
      isSaved: false,
      isReposted: false,
      isArchived: false,
      isEdited: false,
      timestamp: post.created_at.toISOString(),
      commentsAllowed: true,
      likesVisible: true,
    };

    // Mentions inside post content
    try {
      const mentions = extractMentions(content);
      if (mentions.length) {
        const sender = post.user;
        const senderName = sender.display_name || sender.username || "Someone";
        const mentionedUsers = await prisma.user.findMany({
          where: { username: { in: mentions } },
          select: { id: true },
        });
        for (const u of mentionedUsers) {
          if (u.id === req.user.id) continue;
          const notif = await createNotification({
            userId: u.id,
            code: "POST_MENTION",
            title: "Mention",
            message: `${senderName} mentioned you in a post`,
            senderId: req.user.id,
            sourceId: post.id,
            sourceType: "post",
            metadata: { postId: post.id },
          });
          await emitNotificationNew({
            receiverId: u.id,
            kind: "mention",
            notification: notif,
            extra: { postId: post.id },
          });
        }
      }
    } catch {
      // ignore
    }

    return res
      .status(201)
      .json({ message: "Post created successfully", post: normalizedPost });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error while creating post" });
  }
};
