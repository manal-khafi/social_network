// src/Controllers/PostController.ts
import { Request, Response } from "express";
import prisma from "../../config/prismaClient";

export const getMyLikedPosts = async (req: Request, res: Response) => {
  try {
    // req.user est rempli par ton middleware
    const userId = req.user?.id;

    const likedPosts = await prisma.like.findMany({
      where: {
        user_id: userId,
        post_id: { not: null }, // On filtre pour ne prendre que les posts
      },
      include: {
        post: {
          include: {
            user: {
              select: {
                display_name: true,
                username: true,
                avatar_url: true,
              },
            },
            _count: {
              select: { likes: true, comments: true },
            },
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
    });

    // On transforme pour renvoyer une liste d'objets post propres
    const result = likedPosts.map((like) => ({
      ...like.post,
      isLiked: true, // Par définition, ils sont tous likés ici
    }));

    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ message: "Erreur serveur" });
  }
};