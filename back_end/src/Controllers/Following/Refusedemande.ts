import { Response } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthRequest } from "../../types/AuthRequest";

const prisma = new PrismaClient();

export const refuseFollowRequest = async (req: AuthRequest, res: Response) => {
  try {
    const { requestId } = req.params; // UUID string

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

    return res.status(200).json({ message: "Follow request refused", status: "REJECTED" });

  } catch (error) {
    res.status(500).json({ message: "Internal Server Error", error });
  }
};
