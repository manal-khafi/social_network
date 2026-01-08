import { Response } from "express";
import { PrismaClient, PostVisibility } from "@prisma/client";
import { AuthRequest } from "../../types/AuthRequest";

const prisma = new PrismaClient();

export const createPost = async (req: AuthRequest, res: Response) => {
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

    if (media_urls && !media_urls.every(m => typeof m === "string")) {
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
        visibility: (visibility || "public") as PostVisibility,
        user_id: req.user.id,
      }
    });

    return res.status(201).json({ message: "Post created successfully", post });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error while creating post" });
  }
};
