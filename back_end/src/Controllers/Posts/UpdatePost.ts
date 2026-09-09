import { Request, Response } from "express";
import prisma from "../../config/prismaClient";

const MAX_CONTENT = 5000;
const MAX_MEDIA = 10;

export const updatePost = async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "Non authentifié" });
    }

    const { postId } = req.params as { [key: string]: string };
    const { content, media_urls, visibility } = req.body;

    // Check if post exists and belongs to user
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (post.user_id !== req.user.id) {
      return res.status(403).json({ message: "You can only edit your own posts" });
    }

    const text = content !== undefined ? String(content).trim() : undefined;
    if (text !== undefined && text.length > MAX_CONTENT) {
      return res.status(400).json({ message: `Content is too long (max ${MAX_CONTENT})` });
    }

    if (media_urls !== undefined) {
      if (!Array.isArray(media_urls) || media_urls.length > MAX_MEDIA) {
        return res.status(400).json({ message: `media_urls must be an array of up to ${MAX_MEDIA} strings` });
      }
      if (!media_urls.every((m: unknown) => typeof m === "string" && /^https?:\/\//i.test(m) && m.length <= 2048)) {
        return res.status(400).json({ message: "Media URLs must be http(s) strings" });
      }
    }

    const nextContent = text;
    const nextMedia = media_urls;
    const stillHasSomething =
      (nextContent ?? post.content ?? "").trim().length > 0 ||
      ((nextMedia ?? (post.media_urls as string[] | null)) ?? []).length > 0;
    if (!stillHasSomething) {
      return res.status(400).json({ message: "A post needs text or media" });
    }

    if (visibility && !["public", "private", "friends"].includes(visibility)) {
      return res.status(400).json({ message: "Invalid visibility value" });
    }

    // Update post
    const updatedPost = await prisma.post.update({
      where: { id: postId },
      data: {
        content: nextContent === undefined ? undefined : nextContent || null,
        media_urls: nextMedia === undefined ? undefined : nextMedia,
        visibility: visibility ?? undefined,
        updated_at: new Date(),
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
          },
        },
      },
    });

    const normalizedPost = {
      id: updatedPost.id,
      userId: updatedPost.user_id,
      username: updatedPost.user.username || updatedPost.user.display_name || "Unknown User",
      avatar: updatedPost.user.avatar_url ?? undefined,
      content: updatedPost.content ?? "",
      images: (updatedPost.media_urls as string[] | null) ?? undefined,
      likes: updatedPost._count.likes ?? 0,
      comments: updatedPost._count.comments ?? 0,
      shares: updatedPost._count.shares ?? 0,
      saves: updatedPost._count.saves ?? 0,
      isLiked: false,
      isSaved: false,
      isReposted: false,
      isArchived: false,
      isEdited: updatedPost.updated_at > updatedPost.created_at,
      timestamp: updatedPost.created_at.toISOString(),
      visibility: updatedPost.visibility,
      commentsAllowed: updatedPost.user.allow_comments !== false,
      likesVisible: true,
    };

    return res.status(200).json({
      message: "Post updated successfully",
      post: normalizedPost,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error while updating post" });
  }
};
