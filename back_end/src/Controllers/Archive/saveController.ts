import { Request, Response } from "express";
import prisma from "../../config/prismaClient";

// Définition locale pour éviter l'erreur TS2307
type AuthRequest = Request & {
  user?: {
    id: string;
    username: string;
    email: string;
    display_name: string;
  };
}

/**
 * Récupérer les posts sauvegardés (Archives)
 */
export const getArchivedPosts = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ 
        success: false,
        message: "Non authentifié" 
      });
    }

    // On récupère les entrées du modèle 'Save' pour cet utilisateur
    const archivedSaves = await prisma.save.findMany({
      where: {
        user_id: userId,
      },
      include: {
        post: {
          include: {
            user: {
              select: {
                username: true,
                display_name: true,
                avatar_url: true,
              },
            },
            _count: {
              select: {
                likes: true,
                comments: true,
                saves: true,
              },
            },
          },
        },
      },
      orderBy: {
        saved_at: "desc",
      },
    });

    // Transformation pour renvoyer une liste propre de posts
    const posts = archivedSaves.map((save) => ({
      ...save.post,
      saved_at: save.saved_at,
      isSaved: true,
    }));

    return res.status(200).json({
      success: true,
      data: posts
    });
  } catch (error: any) {
    console.error("Erreur Archived Posts:", error);
    return res.status(500).json({ 
      success: false,
      message: "Erreur serveur lors de la récupération des archives" 
    });
  }
};