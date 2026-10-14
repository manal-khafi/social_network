import { Request, Response } from "express";
import prisma from "../../config/prismaClient";

export const getPrivacySettings = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        is_private: true,
        allow_comments: true,
        allow_mentions: true,
        show_activity_status: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json(user);
  } catch (error) {
    console.error("Get privacy settings error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const updatePrivacySettings = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const {
      is_private,
      allow_comments,
      allow_mentions,
      show_activity_status,
    } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(typeof is_private === "boolean" && { is_private }),
        ...(typeof allow_comments === "boolean" && { allow_comments }),
        ...(typeof allow_mentions === "boolean" && { allow_mentions }),
        ...(typeof show_activity_status === "boolean" && {
          show_activity_status,
        }),
      },
      select: {
        is_private: true,
        allow_comments: true,
        allow_mentions: true,
        show_activity_status: true,
      },
    });

    return res.json(updatedUser);
  } catch (error) {
    console.error("Update privacy settings error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
