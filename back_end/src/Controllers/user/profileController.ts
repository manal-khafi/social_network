import { Request, Response } from "express";
import prisma from "../../config/prismaClient";

const BIO_MAX = 160;
const URL_MAX = 2000;

export const getUserProfile = async (req: Request, res: Response) => {
  try {
    const viewerId = req.user?.id;
    const { username } = req.params;

    const userProfile = await prisma.user.findUnique({
      where: { username },
    });

    if (!userProfile || !userProfile.is_active) {
      return res.status(404).json({ message: "User not found" });
    }

    // If I'm viewing my own profile, return more info
    if (viewerId === userProfile.id) {
      return res.json({
        username: userProfile.username,
        display_name: userProfile.display_name,
        bio: userProfile.bio,
        avatar_url: userProfile.avatar_url,
        email: userProfile.email,
        is_verified: userProfile.is_verified,
        created_at: userProfile.created_at,
        location: userProfile.adresse ?? null,
        date_of_birth: userProfile.date_of_birth
          ? userProfile.date_of_birth.toISOString().slice(0, 10)
          : null,
        isPublic: !userProfile.is_private,
      });
    }

    const checkIfFollower = async (vId: string, profileId: string) => {
      if (!vId) return false;
      const follow = await prisma.follow.findFirst({
        where: {
          follower_id: vId,
          followed_id: profileId,
        },
      });
      return !!follow;
    };

    if (userProfile.is_private) {
      const isFollower = await checkIfFollower(viewerId!, userProfile.id);
      if (!isFollower) {
        return res.status(403).json({ message: "This profile is private" });
      }
    }

    return res.json({
      username: userProfile.username,
      display_name: userProfile.display_name,
      bio: userProfile.bio,
      avatar_url: userProfile.avatar_url,
      is_verified: userProfile.is_verified,
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getCurrentUserProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Not authenticated" });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        display_name: user.display_name,
        bio: user.bio,
        avatar_url: user.avatar_url,
        location: user.adresse ?? null,
        date_of_birth: user.date_of_birth ? user.date_of_birth.toISOString().slice(0, 10) : null,
        isPublic: !user.is_private,
      },
    });
  } catch (error) {
    console.error("Error fetching current user profile:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const updateCurrentUserProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: "Not authenticated" });

    const { username, display_name, bio, adresse, date_of_birth, isPublic } = req.body;

    if (!username || !display_name) {
      return res.status(400).json({ success: false, message: "username and display_name are required" });
    }

    if (bio && String(bio).length > BIO_MAX) {
      return res.status(400).json({ success: false, message: `Bio must be <= ${BIO_MAX} characters` });
    }

    // username uniqueness (exclude myself)
    const existing = await prisma.user.findFirst({
      where: { username, NOT: { id: userId } },
      select: { id: true },
    });
    if (existing) {
      return res.status(409).json({ success: false, message: "Username already taken" });
    }

    let dob: Date | null | undefined = undefined;
    if (date_of_birth === "" || date_of_birth === null) {
      dob = null;
    } else if (typeof date_of_birth === "string") {
      const parsed = new Date(date_of_birth);
      if (Number.isNaN(parsed.getTime())) {
        return res.status(400).json({ success: false, message: "Invalid date_of_birth" });
      }
      dob = parsed;
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        username,
        display_name,
        bio: bio ?? null,
        adresse: adresse ?? null,
        date_of_birth: dob,
        ...(typeof isPublic === "boolean" ? { is_private: !isPublic } : {}),
      },
      select: {
        id: true,
        username: true,
        display_name: true,
        bio: true,
        avatar_url: true,
        adresse: true,
        date_of_birth: true,
        is_private: true,
      },
    });

    return res.status(200).json({
      success: true,
      user: {
        id: updated.id,
        username: updated.username,
        display_name: updated.display_name,
        bio: updated.bio,
        avatar_url: updated.avatar_url,
        location: updated.adresse ?? null,
        date_of_birth: updated.date_of_birth ? updated.date_of_birth.toISOString().slice(0, 10) : null,
        isPublic: !updated.is_private,
      },
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const updateMyAvatar = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: "Not authenticated" });

    const { avatar_url } = req.body;
    if (!avatar_url || typeof avatar_url !== "string") {
      return res.status(400).json({ success: false, message: "avatar_url is required" });
    }

    // Firebase download URL should be short-ish
    if (avatar_url.length > URL_MAX) {
      return res.status(400).json({ success: false, message: "Invalid avatar_url" });
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { avatar_url },
      select: {
        id: true,
        username: true,
        display_name: true,
        bio: true,
        avatar_url: true,
        adresse: true,
        date_of_birth: true,
        is_private: true,
      },
    });

    return res.status(200).json({
      success: true,
      user: {
        id: updated.id,
        username: updated.username,
        display_name: updated.display_name,
        bio: updated.bio,
        avatar_url: updated.avatar_url,
        location: updated.adresse ?? null,
        date_of_birth: updated.date_of_birth ? updated.date_of_birth.toISOString().slice(0, 10) : null,
        isPublic: !updated.is_private,
      },
    });

  } catch (error) {
    console.error("Error updating avatar:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};
