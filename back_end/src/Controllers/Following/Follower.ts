import { Request, Response } from "express";
import prisma from "../../config/prismaClient";

const Follower = async (req: Request, res: Response) => {
  const userId = req.params.userId; 
  try {
    const followers = await prisma.follow.findMany({
      where: {
        followed_id: userId,
        status: "accepted",
      },
    });
    const totalFollowers = await prisma.follow.count({
      where: {
        followed_id: userId,
        status: "accepted",
      },
    });

    res.status(200).json({
      total: totalFollowers,
      followersList: followers,
    });

  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

export default Follower;
