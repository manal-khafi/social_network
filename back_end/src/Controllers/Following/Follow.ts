import { Response } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthRequest } from "../../types/AuthRequest";


const prisma = new PrismaClient();

const Follow = async (req: AuthRequest, res: Response) => {
  try {
    const userIdToFollow = req.params.userIdToFollow; // déjà string
    const userId = req.user?.id; // Auth user (string UUID)

    // 1️⃣ Vérifier que l’utilisateur est authentifié
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // 2️⃣ Vérifier si l’utilisateur à suivre existe
    const userToFollow = await prisma.user.findUnique({
      where: { id: userIdToFollow }
    });

    if (!userToFollow) {
      return res.status(404).json({ message: "User to follow not found" });
    }

    // 3️⃣ Vérifier qu’on ne follow pas soi-même
    if (userId === userIdToFollow) {
      return res.status(400).json({ message: "You cannot follow yourself" });
    }

    // 4️⃣ Vérifier si la relation existe déjà avec status accepted
    const alreadyFollowing = await prisma.follow.findFirst({
      where: {
        follower_id: userId,
        followed_id: userIdToFollow,
        status: "accepted" // 👈 uniquement accepted
      }
    });

    if (alreadyFollowing) {
      return res.status(400).json({ message: "Already following this user" });
    }

    // 5️⃣ Si le compte est privé → request pending
    if (userToFollow.is_private === true) {
      await prisma.follow.create({
        data: {
          follower_id: userId,
          followed_id: userIdToFollow,
          status: "pending"
        }
      });

      return res.status(201).json({ message: "Follow request sent", status: "PENDING" });
    }

    // 6️⃣ Sinon follow direct → accepted
    await prisma.follow.create({
      data: {
        follower_id: userId,
        followed_id: userIdToFollow,
        status: "accepted"
      }
    });

    return res.status(201).json({ message: "Successfully followed the user", status: "ACCEPTED" });

  } catch (error) {
    res.status(500).json({ message: "Internal Server Error", error });
  }
};

export default Follow;
