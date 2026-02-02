import {Request, Response } from "express";
import prisma from "../../config/prismaClient";
import { isBlockedEitherWay } from "../../Service/BlockService";
import { createNotification } from "../../Service/notificationService";
import { emitNotificationNew } from "../../Service/notificationRealtime";

const Follow = async (req: Request, res: Response) => {
  try {
    const userIdToFollow = req.params.userIdToFollow; // déjà string
    if (typeof userIdToFollow !== 'string') {
        return res.status(400).json({ message: "Invalid user ID" });
    }
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

    // Check if either user has blocked the other
    if (await isBlockedEitherWay(userId, userIdToFollow)) {
      return res.status(403).json({ message: "Forbidden" });
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

      // notify followed user about follow request
      if (userIdToFollow !== userId) {
        const notif = await createNotification({
          userId: userIdToFollow,
          code: "FOLLOW_REQUEST",
          title: "Follow request",
          message: "sent you a follow request",
          senderId: userId,
          sourceId: userId,
          sourceType: "user",
          metadata: { followerId: userId },
        });
        await emitNotificationNew({
          receiverId: userIdToFollow,
          kind: "follow",
          notification: notif,
          extra: { followerId: userId },
        });
      }

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

    // notify followed user about new follower
    if (userIdToFollow !== userId) {
      const notif = await createNotification({
        userId: userIdToFollow,
        code: "USER_FOLLOWED",
        title: "New follower",
        message: "started following you",
        senderId: userId,
        sourceId: userId,
        sourceType: "user",
        metadata: { followerId: userId },
      });
      await emitNotificationNew({
        receiverId: userIdToFollow,
        kind: "follow",
        notification: notif,
        extra: { followerId: userId },
      });
    }

    return res.status(201).json({ message: "Successfully followed the user", status: "ACCEPTED" });

  } catch (error) {
    res.status(500).json({ message: "Internal Server Error", error });
  }
};

export default Follow;
