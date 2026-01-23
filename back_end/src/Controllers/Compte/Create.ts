import { Response } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthRequest } from "../../types/AuthRequest";
import { promises as fs } from "fs";
import path from "path";

const prisma = new PrismaClient();

const Create = async (req: AuthRequest, res: Response) => {
  try {

    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Non autorisé" });
    }

    if (!req.body.userData) {
      return res.status(400).json({ message: "userData manquant" });
    }

    let userData: any;
    try {
      userData = JSON.parse(req.body.userData);
    } catch {
      return res.status(400).json({ message: "userData invalide (JSON)" });
    }

    const { profile, privacy } = userData;   
    if (!profile?.username || profile.username.length < 3) {
      return res.status(400).json({
        message: "Nom d'utilisateur invalide (min 3 caractères)",
      });
    }

    if (
      profile.gender &&
      !["male", "female", "prefer_not_say"].includes(profile.gender)
    ) {
      return res.status(400).json({ message: "Genre invalide" });
    }
    let avatarUrl: string | null = null;

    if (req.file) {
      if (!req.file.mimetype.startsWith("image/")) {
        return res.status(400).json({ message: "Le fichier doit être une image" });
      }

      if (req.file.size > 5 * 1024 * 1024) {
        return res.status(400).json({ message: "Image trop volumineuse (max 5MB)" });
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
      message: "Profil complété avec succès",
      user: {
        updatedUser
      },
    });

  } catch (error: any) {
    console.error("Erreur update profile:", error);
    if (error.code === "P2002") {
      return res.status(409).json({
        message: "Nom d'utilisateur déjà utilisé",
      });
    }

    return res.status(500).json({
      message: "Erreur serveur lors de la mise à jour du profil",
    });
  }
};

export default Create;
