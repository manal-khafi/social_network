import { Request, Response } from "express";
import prisma from "../../config/prismaClient";
import { createNotification } from "../../Service/notificationService";
import { emitNotificationNew } from "../../Service/notificationRealtime";

const Acceptdemande = async (req: Request, res: Response) => {
  try {
    const demandeId = req.params.demandeId; // string UUID
    const userId = req.user?.id; // string UUID depuis token

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const followRequest = await prisma.follow.findUnique({
      where: { id: demandeId }
    });

    if (!followRequest) {
      return res.status(404).json({ message: "Follow request not found" });
    }

    // Vérifier que l’utilisateur connecté est bien le propriétaire du follow (celui qui reçoit la demande)
    if (followRequest.followed_id !== userId) {
      return res.status(403).json({ message: "You are not authorized to accept this follow request" });
    }

    // Vérifier que le status est bien pending
    if (followRequest.status !== "pending") {
      return res.status(400).json({ message: "This follow request is not pending" });
    }

    // Mettre à jour en accepted
    await prisma.follow.update({
      where: { id: demandeId },
      data: { status: "accepted" }
    });

    // Notify the follower that their request was accepted
    try {
      const receiverId = followRequest.follower_id;
      if (receiverId && receiverId !== userId) {
        const notif = await createNotification({
          userId: receiverId,
          code: "FOLLOW_ACCEPTED",
          title: "Follow request accepted",
          message: "accepted your follow request",
          senderId: userId,
          sourceId: userId,
          sourceType: "user",
          metadata: { followedId: userId },
        });
        await emitNotificationNew({
          receiverId,
          kind: "follow",
          notification: notif,
          extra: { followedId: userId },
        });
      }
    } catch {
      // ignore
    }

    res.status(200).json({ message: "Follow request accepted" });

  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export default Acceptdemande;
