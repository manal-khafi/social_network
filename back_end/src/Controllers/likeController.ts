import { Response } from "express";
import { AuthRequest } from "../types/AuthRequest";
import { prisma } from "../config/prismaClient";

// Toggle like on a post (like if not liked, unlike if already liked)
export const toggleLike = async (req: AuthRequest, res: Response) => {
  try {
    // Validate authentication
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = req.user.id;
    const { postId } = req.params;

    // Validate postId parameter
    if (!postId || typeof postId !== "string" || postId.trim() === "") {
      return res.status(400).json({ message: "Invalid post ID" });
    }

    // Validate userId (should always be present from auth middleware, but double-check)
    if (!userId || typeof userId !== "string" || userId.trim() === "") {
      return res.status(401).json({ message: "Invalid user ID" });
    }

    // Check if post exists and is not deleted
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        _count: {
          select: {
            likes: true,
          },
        },
      },
    });

    if (!post || post.is_deleted) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Check if like already exists using findFirst (because comment_id is optional in unique constraint)
    // For post likes, comment_id should be null
    const existingLike = await prisma.like.findFirst({
      where: {
        user_id: userId,
        post_id: postId,
        comment_id: null, // Explicitly check for null (post like, not comment like)
      },
    });

    if (existingLike) {
      // Unlike: delete the like
      await prisma.like.delete({
        where: {
          id: existingLike.id,
        },
      });

      // Get updated like count
      const updatedPost = await prisma.post.findUnique({
        where: { id: postId },
        include: {
          _count: {
            select: {
              likes: true,
            },
          },
        },
      });

      return res.json({
        message: "Post unliked",
        isLiked: false,
        likeCount: updatedPost?._count.likes || 0,
      });
    } else {
      // Like: create the like
      // For post likes, we don't set comment_id (it will be null by default)
      await prisma.like.create({
        data: {
          user_id: userId,
          post_id: postId,
          // comment_id is omitted - Prisma will set it to null for post likes
        },
      });

      // Get updated like count
      const updatedPost = await prisma.post.findUnique({
        where: { id: postId },
        include: {
          _count: {
            select: {
              likes: true,
            },
          },
        },
      });

      return res.status(201).json({
        message: "Post liked",
        isLiked: true,
        likeCount: updatedPost?._count.likes || 0,
      });
    }
  } catch (error: any) {
    console.error("Error toggling like:", error);

    // Handle unique constraint violation
    if (error.code === "P2002") {
      return res.status(409).json({ message: "Post already liked" });
    }

    // Handle foreign key constraint violations
    if (error.code === "P2003") {
      return res.status(404).json({ message: "Post or user not found" });
    }

    res.status(500).json({ message: "Error toggling like" });
  }
};

// Legacy functions for backward compatibility (if needed)
export const likePost = async (req: AuthRequest, res: Response) => {
  try {
    // Validate authentication
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = req.user.id;
    const { postId } = req.params;

    // Validate postId parameter
    if (!postId || typeof postId !== "string" || postId.trim() === "") {
      return res.status(400).json({ message: "Invalid post ID" });
    }

    // Validate userId
    if (!userId || typeof userId !== "string" || userId.trim() === "") {
      return res.status(401).json({ message: "Invalid user ID" });
    }

    // Check if post exists and is not deleted
    const post = await prisma.post.findUnique({ where: { id: postId } });

    if (!post || post.is_deleted) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Check if like already exists using findFirst
    const existingLike = await prisma.like.findFirst({
      where: {
        user_id: userId,
        post_id: postId,
        comment_id: null, // Post like, not comment like
      },
    });

    if (existingLike) {
      return res.status(409).json({ message: "Post already liked" });
    }

    // Create the like
    const like = await prisma.like.create({
      data: {
        user_id: userId,
        post_id: postId,
        // comment_id omitted - will be null for post likes
      },
    });

    res.status(201).json(like);
  } catch (error: any) {
    console.error("Error liking post:", error);

    // Handle unique constraint violation
    if (error.code === "P2002") {
      return res.status(409).json({ message: "Post already liked" });
    }

    // Handle foreign key constraint violations
    if (error.code === "P2003") {
      return res.status(404).json({ message: "Post or user not found" });
    }

    res.status(500).json({ message: "Error liking post" });
  }
};

export const unlikePost = async (req: AuthRequest, res: Response) => {
  try {
    // Validate authentication
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = req.user.id;
    const { postId } = req.params;

    // Validate postId parameter
    if (!postId || typeof postId !== "string" || postId.trim() === "") {
      return res.status(400).json({ message: "Invalid post ID" });
    }

    // Validate userId
    if (!userId || typeof userId !== "string" || userId.trim() === "") {
      return res.status(401).json({ message: "Invalid user ID" });
    }

    // Find existing like using findFirst (because comment_id is optional in unique constraint)
    const existingLike = await prisma.like.findFirst({
      where: {
        user_id: userId,
        post_id: postId,
        comment_id: null, // Post like, not comment like
      },
    });

    if (!existingLike) {
      return res.status(404).json({ message: "Like not found" });
    }

    // Delete the like
    await prisma.like.delete({
      where: {
        id: existingLike.id,
      },
    });

    res.json({ message: "Post unliked" });
  } catch (error: any) {
    console.error("Error unliking post:", error);

    // Handle not found errors
    if (error.code === "P2025") {
      return res.status(404).json({ message: "Like not found" });
    }

    res.status(500).json({ message: "Error unliking post" });
  }
};
