import { Response } from "express";
import { AuthRequest } from "../types/AuthRequest";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const savePost = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }
    const userId = req.user.id;
    const { postId } = req.params;

    const post = await prisma.post.findUnique({ where: { id: postId } });

    if (!post || post.is_deleted) {
      return res.status(404).json({ message: "Post not found" });
    }

    const existingSave = await prisma.save.findUnique({
      where: {
        user_id_post_id: { user_id: userId, post_id: postId },
      },
    });

    if (existingSave) {
      return res.status(409).json({ message: "Post already saved" });
    }

    const save = await prisma.save.create({
      data: {
        user_id: userId,
        post_id: postId,
      },
    });

    res.status(201).json(save);
  } catch (error) {
    console.error("Error saving post:", error);
    res.status(500).json({ message: "Error saving post" });
  }
};

export const unsavePost = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }
    const userId = req.user.id;
    const { postId } = req.params;

    await prisma.save.delete({
      where: {
        user_id_post_id: { user_id: userId, post_id: postId },
      },
    });

    res.json({ message: "Post unsaved" });
  } catch (error) {
    console.error("Error unsaving post:", error);
    res.status(404).json({ message: "Save not found" });
  }
};
