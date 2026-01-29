import { Request, Response } from "express";
import prisma from "../../config/prismaClient";

export const getFollowRequests = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const requests = await prisma.follow.findMany({
      where: {
        followed_id: userId,
        status: "pending",
      },
      include: {
        follower: {
          select: {
            id: true,
            username: true,
            display_name: true,
            avatar_url: true,
            bio: true,
          },
        },
      },
      orderBy: { created_at: "desc" },
    });

    const result = requests.map((reqItem) => ({
      requestId: reqItem.id,
      user: {
        id: reqItem.follower.id,
        username: reqItem.follower.username,
        display_name: reqItem.follower.display_name,
        avatar_url: reqItem.follower.avatar_url,
        bio: reqItem.follower.bio,
      },
    }));

    return res.status(200).json({ requests: result });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};
