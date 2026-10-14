import { Request, Response } from "express";
import prisma from "../../config/prismaClient";

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

    // The picture is uploaded beforehand through POST /api/upload; only its
    // URL arrives here. undefined = not sent: keep the current avatar (for
    // example the one from Google sign-in); null = remove it.
    let avatarUrl: string | null | undefined;
    if (profile.avatarUrl === null) {
      avatarUrl = null;
    } else if (profile.avatarUrl !== undefined) {
      if (
        typeof profile.avatarUrl !== "string" ||
        profile.avatarUrl.length > 2048 ||
        !/^https?:\/\/\S+$/.test(profile.avatarUrl)
      ) {
        return res.status(400).json({ message: "Invalid avatar URL" });
      }
      avatarUrl = profile.avatarUrl;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        username: profile.username,
        display_name: profile.displayName || profile.username,
        bio: profile.bio || null,
        gender: profile.gender || null,
        is_private: privacy?.type === "private",
        ...(avatarUrl !== undefined && { avatar_url: avatarUrl }),
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
