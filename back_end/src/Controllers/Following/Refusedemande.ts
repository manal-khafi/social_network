import { Request, Response } from "express";
import prisma from "../../config/prismaClient";
import { createNotification } from "../../Service/notificationService";
import { emitNotificationNew } from "../../Service/notificationRealtime";

export const refuseFollowRequest = async (req: Request, res: Response) => {
  try {
    const { requestId } = req.params; // UUID string
    if (typeof requestId !== 'string') {
        return res.status(400).json({ message: "Invalid request ID" });
    }

    const followRequest = await prisma.follow.findUnique({
      where: { id: requestId } // Pas de parseInt ❌
    });

    if (!followRequest) {
      return res.status(404).json({ message: "Follow request not found" });
    }

    if (followRequest.status !== "pending") {
      return res.status(400).json({ message: "This request is not pending" });
    }

    // Optionnel : Vérifier que l’utilisateur connecté est bien celui qui doit répondre à la demande
    if (followRequest.followed_id !== req.user?.id) {
      return res.status(403).json({ message: "Not allowed to refuse this request" });
    }

    await prisma.follow.update({
      where: { id: requestId },
      data: { status: "rejected" }
    });

    // Notify the follower that their request was rejected
    try {
      const receiverId = followRequest.follower_id;
      const senderId = followRequest.followed_id;
      if (receiverId && senderId && receiverId !== senderId) {
        const notif = await createNotification({
          userId: receiverId,
          code: "FOLLOW_REJECTED",
          title: "Follow request rejected",
          message: "rejected your follow request",
          senderId,
          sourceId: senderId,
          sourceType: "user",
          metadata: { followedId: senderId },
        });
        await emitNotificationNew({
          receiverId,
          kind: "follow",
          notification: notif,
          extra: { followedId: senderId },
        });
      }
    } catch {
      // ignore
    }

    return res.status(200).json({ message: "Follow request refused", status: "REJECTED" });

  } catch (error) {
    res.status(500).json({ message: "Internal Server Error", error });
  }
};
