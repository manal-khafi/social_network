import { Request, Response } from "express";
import prisma from "../../config/prismaClient";

const MAX_CONTENT = 5000;
const MAX_MEDIA = 10;

const validateMedia = (media_urls: unknown): string | null => {
  if (media_urls == null) return null;
  if (!Array.isArray(media_urls)) return "media_urls must be an array of strings";
  if (media_urls.length > MAX_MEDIA) return `Up to ${MAX_MEDIA} media items per post`;
  for (const m of media_urls) {
    if (typeof m !== "string" || m.length > 2048) return "Invalid media URL";
    if (!/^https?:\/\//i.test(m)) return "Media URLs must be http(s)";
  }
  return null;
};

export const createPost = async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const { content, media_urls, visibility } = req.body;

    const text = typeof content === "string" ? content.trim() : "";
    const hasMedia = Array.isArray(media_urls) && media_urls.length > 0;

    if (!text && !hasMedia) {
      return res.status(400).json({ message: "Add some text or media" });
    }
    if (text.length > MAX_CONTENT) {
      return res.status(400).json({ message: `Content is too long (max ${MAX_CONTENT})` });
    }

    const mediaError = validateMedia(media_urls);
    if (mediaError) return res.status(400).json({ message: mediaError });

    const allowedVisibilities = ["public", "private", "friends"];
    if (visibility && !allowedVisibilities.includes(visibility)) {
      return res.status(400).json({ message: "Invalid visibility value" });
    }

    const post = await prisma.post.create({
      data: {
        content: text || null,
        media_urls: hasMedia ? (media_urls as string[]) : undefined,
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
            allow_comments: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: { where: { is_deleted: false } },
            shares: true,
            saves: true,
            reposts: true,
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
      visibility: post.visibility,
      likes: post._count.likes ?? 0,
      comments: post._count.comments ?? 0,
      shares: (post._count.reposts ?? 0) + (post._count.shares ?? 0),
      saves: post._count.saves ?? 0,
      isLiked: false,
      isSaved: false,
      isReposted: false,
      isArchived: false,
      isEdited: false,
      timestamp: post.created_at.toISOString(),
      commentsAllowed: post.user.allow_comments !== false,
      likesVisible: true,
    };

    return res
      .status(201)
      .json({ message: "Post created successfully", post: normalizedPost });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error while creating post" });
  }
};
