import { Response } from "express";
import { AuthRequest } from "../../types/AuthRequest";
import { prisma } from "../../config/prismaClient";

export const repostPost = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = req.user.id;
    const { postId } = req.params;
    const { caption } = req.body;

    // Check if original post exists and is not deleted
    const originalPost = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!originalPost || originalPost.is_deleted) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Prevent reposting own post
    if (originalPost.user_id === userId) {
      return res.status(400).json({
        message: "You cannot repost your own post",
      });
    }

    const existingRepost = await prisma.repost.findFirst({
      where: {
        user_id: userId,
        original_post_id: postId,
      },
    });

    if (existingRepost) {
      return res.status(409).json({
        message: "Post already reposted",
      });
    }

    const repost = await prisma.repost.create({
      data: {
        user_id: userId,
        original_post_id: postId,
        caption: caption || null,
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
        originalPost: {
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
        },
      },
    });

    res.status(201).json(repost);
  } catch (error: any) {
    console.error("Error reposting:", error);
    // Handle unique constraint violation
    if (error.code === "P2002") {
      return res.status(409).json({
        message: "Post already reposted",
      });
    }
    res.status(500).json({ message: "Error reposting post" });
  }
};

export const removeRepost = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = req.user.id;
    const { postId } = req.params;

    const repost = await prisma.repost.findFirst({
      where: {
        user_id: userId,
        original_post_id: postId,
      },
    });

    if (!repost) {
      return res.status(404).json({ message: "Repost not found" });
    }

    await prisma.repost.delete({
      where: {
        id: repost.id,
      },
    });

    res.json({ message: "Repost removed successfully" });
  } catch (error) {
    console.error("Error removing repost:", error);
    res.status(500).json({ message: "Error removing repost" });
  }
};

// For backward compatibility if routes use different names
export const repost = repostPost;
export const unRepost = removeRepost;
