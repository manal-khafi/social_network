import { Request, Response } from "express";
import prisma from "../../config/prismaClient";
import { isBlockedEitherWay } from "../../Service/BlockService";

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

    // Check if viewer or target user has blocked each other
    if (viewerId) { // Only check if viewer is authenticated
      const blocked = await isBlockedEitherWay(viewerId, userProfile.id);
      if (blocked) {
        return res.status(404).json({ message: "User not found" }); // Return 404 for privacy
      }
    }

    // If I'm viewing my own profile, return more info
    if (viewerId === userProfile.id) {
      return res.json({
        id: userProfile.id,
        username: userProfile.username,
        display_name: userProfile.display_name,
        bio: userProfile.bio,
        avatar_url: userProfile.avatar_url,

        email: userProfile.email,
        is_verified: userProfile.is_verified,
        created_at: userProfile.created_at,

        adresse: userProfile.adresse ?? null,
        date_of_birth: userProfile.date_of_birth
          ? userProfile.date_of_birth.toISOString().slice(0, 10)
          : null,

        is_private: userProfile.is_private,
        allow_comments: userProfile.allow_comments,
        allow_mentions: userProfile.allow_mentions,
        show_activity_status: userProfile.show_activity_status,
        cover_image: userProfile.cover_image ?? null,
      });
    }


    const checkIfFollower = async (vId: string, profileId: string) => {
      if (!vId) return false;
      const follow = await prisma.follow.findFirst({
        where: {
          follower_id: vId,
          followed_id: profileId,
          status: "accepted",
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
      id: userProfile.id,
      username: userProfile.username,
      display_name: userProfile.display_name,
      bio: userProfile.bio,
      avatar_url: userProfile.avatar_url,
      is_verified: userProfile.is_verified,
      cover_image: userProfile.cover_image ?? null,
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
        adresse: user.adresse,
        date_of_birth: user.date_of_birth ? user.date_of_birth.toISOString().slice(0, 10) : null,
        is_private: user.is_private,
        allow_comments: user.allow_comments,
        allow_mentions: user.allow_mentions,
        show_activity_status: user.show_activity_status,
        cover_image: user.cover_image ?? null,
      }

    });
  } catch (error) {
    console.error("Error fetching current user profile:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const updateCurrentUserProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Not authenticated" });
    }

    const {
      username,
      display_name,
      bio,
      adresse,
      date_of_birth,
      is_private,
      allow_comments,
      allow_mentions,
      show_activity_status,
    } = req.body as {
      username?: string;
      display_name?: string;
      bio?: string | null;
      adresse?: string | null;
      date_of_birth?: string | null;

      is_private?: boolean;
      allow_comments?: boolean;
      allow_mentions?: boolean;
      show_activity_status?: boolean;
    };

    if (!username || !display_name) {
      return res.status(400).json({
        success: false,
        message: "username and display_name are required",
      });
    }

    if (bio && String(bio).length > BIO_MAX) {
      return res.status(400).json({
        success: false,
        message: `Bio must be <= ${BIO_MAX} characters`,
      });
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
        ...(typeof is_private === "boolean" ? { is_private } : {}),
        ...(typeof allow_comments === "boolean" ? { allow_comments } : {}),
        ...(typeof allow_mentions === "boolean" ? { allow_mentions } : {}),
        ...(typeof show_activity_status === "boolean" ? { show_activity_status } : {}),
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
        allow_comments: true,
        allow_mentions: true,
        show_activity_status: true,
        cover_image: true,
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
        adresse: updated.adresse ?? null,
        date_of_birth: updated.date_of_birth ? updated.date_of_birth.toISOString().slice(0, 10) : null,

        is_private: updated.is_private,
        allow_comments: updated.allow_comments,
        allow_mentions: updated.allow_mentions,
        show_activity_status: updated.show_activity_status,
        cover_image: updated.cover_image ?? null,
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
        cover_image: true,
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
        adresse: updated.adresse ?? null,
        date_of_birth: updated.date_of_birth ? updated.date_of_birth.toISOString().slice(0, 10) : null,

        is_private: updated.is_private,
        cover_image: updated.cover_image ?? null,
      },
    });


  } catch (error) {
    console.error("Error updating avatar:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const updateCoverImage = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { cover_image } = req.body;

    if (!userId) return res.status(401).json({ success: false, message: "Not authenticated" });

    if (!cover_image || typeof cover_image !== "string" || cover_image.length > URL_MAX) {
      return res.status(400).json({ success: false, message: "Invalid cover_image" });
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { cover_image },
      select: {
        id: true,
        username: true,
        display_name: true,
        bio: true,
        avatar_url: true,
        adresse: true,
        date_of_birth: true,
        is_private: true,
        allow_comments: true,
        allow_mentions: true,
        show_activity_status: true,
        cover_image: true,
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
        adresse: updated.adresse ?? null,
        date_of_birth: updated.date_of_birth ? updated.date_of_birth.toISOString().slice(0, 10) : null,

        is_private: updated.is_private,
        allow_comments: updated.allow_comments,
        allow_mentions: updated.allow_mentions,
        show_activity_status: updated.show_activity_status,
        cover_image: updated.cover_image ?? null,
      },
    });
  } catch (error) {
    console.error("Update cover image error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};
