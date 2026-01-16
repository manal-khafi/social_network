import { Response } from "express";
import { AuthRequest } from "../../types/AuthRequest";
import { prisma } from "../../config/prismaClient";

// CREATE POST
export const createPost = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = req.user.id;
    const { content, media_urls, visibility } = req.body;

    // Validate that post has content or media
    if (
      !content &&
      (!media_urls || (Array.isArray(media_urls) && media_urls.length === 0))
    ) {
      return res.status(400).json({
        message: "Post must contain text or media",
      });
    }

    // Validate visibility enum
    const validVisibility =
      visibility && ["public", "private", "friends"].includes(visibility)
        ? (visibility as "public" | "private" | "friends")
        : "public";

    const post = await prisma.post.create({
      data: {
        content: content || null,
        media_urls: media_urls || null,
        visibility: validVisibility,
        user_id: userId,
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
            comments: true,
            likes: true,
            reposts: true,
            shares: true,
            saves: true,
          },
        },
      },
    });

    res.status(201).json(post);
  } catch (error) {
    console.error("Error creating post:", error);
    res.status(500).json({ message: "Error creating post" });
  }
};

// GET FEED (PUBLIC POSTS)
export const getPosts = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    const posts = await prisma.post.findMany({
      where: {
        is_deleted: false,
        visibility: "public",
      },
      orderBy: { created_at: "desc" },
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
            comments: true,
            likes: true,
            reposts: true,
            shares: true,
            saves: true,
          },
        },
        // Include user's like status if authenticated
        ...(userId
          ? {
              likes: {
                where: { user_id: userId },
                select: { id: true },
              },
              reposts: {
                where: { user_id: userId },
                select: { id: true },
              },
            }
          : {}),
      },
    });

    // Transform posts to include like/repost status
    const transformedPosts = posts.map((post: any) => {
      const { likes: _likes, reposts: _reposts, ...postData } = post;
      return {
        ...postData,
        isLiked: userId ? post.likes && post.likes.length > 0 : false,
        isReposted: userId ? post.reposts && post.reposts.length > 0 : false,
      };
    });

    res.json(transformedPosts);
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({ message: "Error fetching posts" });
  }
};

// UPDATE POST
export const updatePost = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = req.user.id;
    const { id } = req.params;
    const { content, media_urls, visibility } = req.body;

    const post = await prisma.post.findUnique({ where: { id } });

    if (!post || post.is_deleted) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (post.user_id !== userId) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this post" });
    }

    // Validate that updated post has content or media
    const updatedContent = content !== undefined ? content : post.content;
    const updatedMedia =
      media_urls !== undefined ? media_urls : post.media_urls;

    if (
      !updatedContent &&
      (!updatedMedia ||
        (Array.isArray(updatedMedia) && updatedMedia.length === 0))
    ) {
      return res.status(400).json({
        message: "Post must contain text or media",
      });
    }

    // Validate visibility if provided
    const validVisibility =
      visibility && ["public", "private", "friends"].includes(visibility)
        ? (visibility as "public" | "private" | "friends")
        : post.visibility;

    const updatedPost = await prisma.post.update({
      where: { id },
      data: {
        ...(content !== undefined && { content }),
        ...(media_urls !== undefined && { media_urls }),
        ...(visibility !== undefined && { visibility: validVisibility }),
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
            comments: true,
            likes: true,
            reposts: true,
            shares: true,
            saves: true,
          },
        },
      },
    });

    res.json(updatedPost);
  } catch (error) {
    console.error("Error updating post:", error);
    res.status(500).json({ message: "Error updating post" });
  }
};

// SOFT DELETE POST
export const deletePost = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = req.user.id;
    const { id } = req.params;

    const post = await prisma.post.findUnique({ where: { id } });

    if (!post || post.is_deleted) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (post.user_id !== userId) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this post" });
    }

    // Soft delete the post - related likes, reposts, etc. are handled by cascade or remain
    // but won't be visible since post is marked as deleted
    await prisma.post.update({
      where: { id },
      data: { is_deleted: true },
    });

    res.json({ message: "Post deleted successfully" });
  } catch (error) {
    console.error("Error deleting post:", error);
    res.status(500).json({ message: "Error deleting post" });
  }
};
