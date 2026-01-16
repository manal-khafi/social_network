import { Response } from "express";
import { AuthRequest } from "../../types/AuthRequest";
import { prisma } from "../../config/prismaClient";
import { generateAccessToken } from "../../util/jwt";

const create = async (req: AuthRequest, res: Response) => {
  try {
    console.log("hereeee", req.body);
    // Validate authentication
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const userId = req.user.id;

    // Parse userData from FormData
    if (!req.body.userData) {
      return res.status(400).json({
        success: false,
        message: "userData is required",
      });
    }

    let userData;
    try {
      userData = JSON.parse(req.body.userData);
    } catch (parseError) {
      return res.status(400).json({
        success: false,
        message: "Invalid userData format",
      });
    }

    const { profile, privacy, accountSetup } = userData;

    // Validate required fields
    if (!profile || !profile.username) {
      return res.status(400).json({
        success: false,
        message: "Username is required",
      });
    }

    // Check if username is already taken
    const existingUser = await prisma.user.findFirst({
      where: {
        username: profile.username,
        NOT: { id: userId },
      },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Username already taken",
      });
    }

    // Process image - handle both file upload and base64
    let avatarUrl: string | null = null;

    // Check if file was uploaded via multer
    const file = (req as any).file;
    if (file) {
      // Convert file buffer to base64 for storage
      // In production, upload to Firebase Storage or S3
      const base64Image = file.buffer.toString("base64");
      avatarUrl = `data:${file.mimetype};base64,${base64Image}`;
    } else if (req.body.profileImageBase64) {
      // If base64 image was provided directly
      avatarUrl = `data:image/jpeg;base64,${req.body.profileImageBase64}`;
    }

    // Update user profile in database
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        username: profile.username,
        display_name: profile.displayName || profile.username,
        gender: profile.gender || null,
        bio: profile.bio || null,
        avatar_url: avatarUrl,
        is_private: privacy?.type === "private" || false,
        updated_at: new Date(),
      },
    });

    // Generate new JWT token with updated user info
    const token = generateAccessToken({
      id: updatedUser.id,
      email: updatedUser.email,
      role: req.user.role,
      permissions: req.user.permissions || [],
    });

    // Return success response
    return res.status(200).json({
      success: true,
      message: "Profile created successfully",
      token,
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        display_name: updatedUser.display_name,
        avatar_url: updatedUser.avatar_url,
        is_private: updatedUser.is_private,
      },
    });
  } catch (error: any) {
    console.error("Error creating profile:", error);

    // Handle Prisma unique constraint errors
    if (error.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: "Username already taken",
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || "Error creating profile",
    });
  }
};

export default create;
