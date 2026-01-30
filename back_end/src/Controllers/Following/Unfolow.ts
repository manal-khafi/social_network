import { Request, Response } from "express";
import prisma from "../../config/prismaClient";
import { isBlockedEitherWay } from "../../services/BlockService";

const Unfollow = async (req: Request, res: Response) => {
  try {
    const userIdToUnfollow = req.params.userIdToUnfollow;
    const userId = req.user?.id; 

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const userToUnfollow = await prisma.user.findUnique({
      where: { id: userIdToUnfollow }
    });

    if (!userToUnfollow) {
      return res.status(404).json({ message: "User to unfollow not found" });
    }

    // Check if either user has blocked the other
    if (await isBlockedEitherWay(userId, userIdToUnfollow)) {
        return res.status(403).json({ message: "Forbidden" });
    }

    const existingFollow = await prisma.follow.findFirst({
      where: {
        follower_id: userId,
        followed_id: userIdToUnfollow,
        status: "accepted"
        
      }
    });

    if (!existingFollow) {
      return res.status(400).json({ message: "You are not following this user or request not accepted" });
    }
    await prisma.follow.delete({
      where: { id: existingFollow.id }
    });

    res.status(200).json({ message: "Successfully unfollowed the user" });

  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export default Unfollow;
