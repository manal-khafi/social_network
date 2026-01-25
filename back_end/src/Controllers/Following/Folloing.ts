import { Request, Response } from "express";
import prisma from "../../config/prismaClient";

const Following = async (req: Request, res: Response) => {
  const userId = req.params.userId; // UUID string

  try {
    // Liste des followers acceptés
    const followers = await prisma.follow.findMany({
      where: {
        followed_id: userId,
        status: "accepted",
      },
    });

    // Total followers (accepted seulement si tu veux compter uniquement les abonnements validés)
    const totalFollowers = await prisma.follow.count({
      where: {
        followed_id: userId,
        status: "accepted",
      },
    });

    return res.status(200).json({
      total: totalFollowers,
      followersList: followers,
    });

  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

export default Following;
