import { Request, Response } from "express";
import prisma from "../../config/prismaClient";
import { promises as fs } from "fs";
import path from "path";

const Create = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!req.body.userData) {
      return res.status(400).json({ message: "Missing userData" });
    }

    let userData: any;
    try {
      userData = JSON.parse(req.body.userData);
    } catch {
      return res.status(400).json({ message: "Invalid userData (JSON)" });
    }

    const { profile, privacy } = userData;

    if (!profile?.username || profile.username.length < 3) {
      return res.status(400).json({
        message: "Invalid username (minimum 3 characters)",
      });
    }

    if (
      profile.gender &&
      !["male", "female", "prefer_not_say"].includes(profile.gender)
    ) {
      return res.status(400).json({ message: "Invalid gender" });
    }

    let avatarUrl: string | null = null;

    if (req.file) {
      if (!req.file.mimetype.startsWith("image/")) {
        return res
          .status(400)
          .json({ message: "File must be an image" });
      }

      if (req.file.size > 5 * 1024 * 1024) {
        return res
          .status(400)
          .json({ message: "Image too large (max 5MB)" });
      }

      const avatarFileName = `${userId}.png`;
      const avatarDir = path.join(__dirname, "../../../uploads/avatars");
      await fs.mkdir(avatarDir, { recursive: true });

      const avatarPath = path.join(avatarDir, avatarFileName);
      await fs.writeFile(avatarPath, req.file.buffer);

      avatarUrl = `/uploads/avatars/${avatarFileName}`;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        username: profile.username,
        display_name: profile.displayName || profile.username,
        bio: profile.bio || null,
        gender: profile.gender || null,
        is_private: privacy?.type === "private",
        avatar_url: avatarUrl,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Profile successfully completed",
      user: {
        updatedUser,
      },
    });
  } catch (error: any) {
    console.error("Profile update error:", error);

    if (error.code === "P2002") {
      return res.status(409).json({
        message: "Username already in use",
      });
    }

    return res.status(500).json({
      message: "Server error while updating profile",
    });
  }
};

export default Create;
