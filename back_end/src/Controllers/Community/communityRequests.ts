import { Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const communityRequest = async (req: Request, res: Response, next: NextFunction) => {
  const communityId = req.params.communityId;
  if (typeof communityId !== 'string') {
    return res.status(400).json({ message: "Invalid community ID" });
  }

  try {
    const requests = await prisma.joinRequest.findMany({
      where: { community_id: communityId },
      include: { user: true },
    });

    res.status(200).json({ requests });
  } catch (error) {
    next(error);
  }
}

const createCommunityRequest = async (req: Request, res: Response, next: NextFunction) => {
  const { message } = req.body;
  const communityId = req.params.communityId;
  const userIdParam = req.params.userId;
  if (typeof communityId !== 'string' || typeof userIdParam !== 'string') {
    return res.status(400).json({ message: "Invalid ID" });
  }
  try {
    const newRequest = await prisma.joinRequest.create({
      data: {
        community_id: communityId,
        user_id: userIdParam,
        message: message || null,
        status: 'pending',
      },
    });

    res.status(201).json({ status: "success", request: newRequest });
  } catch (error) {
    next(error);
  }
}

const handlerequest = async (req: Request, res: Response, next: NextFunction) => {
  const { status } = req.body;
  const communityId = req.params.communityId;
  const requestId = req.params.requestId;
  const userId = req.params.userId;
  if (typeof communityId !== 'string' || typeof requestId !== 'string' || typeof userId !== 'string') {
    return res.status(400).json({ message: "Invalid ID" });
  }

  try {
    const updatedRequest = await prisma.joinRequest.updateMany({
      where: {
        id: requestId,
        community_id: communityId,
      },
      data: {
        status: status,
      },
    });

    if (status === 'approved') {
      const addedMember = await prisma.communityMember.create({
        data: {
          community_id: communityId,
          user_id: userId,
        },
      });
    }

    res.status(200).json({ request: updatedRequest });
  } catch (error) {
    next(error);
  }
}

export default {  communityRequest, createCommunityRequest, handlerequest };