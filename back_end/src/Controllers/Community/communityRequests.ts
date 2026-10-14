import { Request, Response, NextFunction } from "express";
import prisma from "../../config/prismaClient";
import { publicUserSelect } from "../../util/publicUser";
import { requireCommunityAdmin } from "./communityAccess";

const communityRequest = async (req: Request, res: Response, next: NextFunction) => {
  const communityId = (req.params.communityId as string);

  try {
    const access = await requireCommunityAdmin(req, res, communityId);
    if (!access) return;

    const requests = await prisma.joinRequest.findMany({
      where: { community_id: communityId },
      include: { user: { select: publicUserSelect } },
    });

    res.status(200).json({ requests });
  } catch (error) {
    next(error);
  }
}

// The requester is always the authenticated user; the :userId URL segment is
// kept for route compatibility but ignored.
const createCommunityRequest = async (req: Request, res: Response, next: NextFunction) => {
  const { message } = req.body;
  const communityId = (req.params.communityId as string);
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ status: "error", message: "Not authenticated" });
    }

    const community = await prisma.community.findUnique({
      where: { id: communityId },
      select: { id: true },
    });
    if (!community) {
      return res.status(404).json({ status: "error", message: "Community not found" });
    }

    const existingMember = await prisma.communityMember.findUnique({
      where: { community_id_user_id: { community_id: communityId, user_id: userId } },
      select: { id: true },
    });
    if (existingMember) {
      return res.status(409).json({ status: "error", message: "You are already a member of this community" });
    }

    const pendingRequest = await prisma.joinRequest.findFirst({
      where: { community_id: communityId, user_id: userId, status: 'pending' },
      select: { id: true },
    });
    if (pendingRequest) {
      return res.status(409).json({ status: "error", message: "You already have a pending request for this community" });
    }

    const newRequest = await prisma.joinRequest.create({
      data: {
        community_id: communityId,
        user_id: userId,
        message: message || null,
        status: 'pending',
      },
    });

    res.status(201).json({ status: "success", request: newRequest });
  } catch (error) {
    next(error);
  }
}

// Approve / reject a join request (owner/admin only). The member that gets
// added is the user stored on the request, never the :userId URL segment.
const handlerequest = async (req: Request, res: Response, next: NextFunction) => {
  const { status } = req.body;
  const communityId = (req.params.communityId as string);
  const requestId = (req.params.requestId as string);

  try {
    const access = await requireCommunityAdmin(req, res, communityId);
    if (!access) return;

    if (status !== 'approved' && status !== 'rejected') {
      return res.status(400).json({ status: "error", message: "status must be 'approved' or 'rejected'" });
    }

    const joinRequest = await prisma.joinRequest.findFirst({
      where: { id: requestId, community_id: communityId },
      select: { id: true, user_id: true, status: true },
    });
    if (!joinRequest) {
      return res.status(404).json({ status: "error", message: "Join request not found" });
    }
    if (joinRequest.status !== 'pending') {
      return res.status(409).json({ status: "error", message: "This request has already been handled" });
    }

    const updatedRequest = await prisma.$transaction(async (tx) => {
      const updated = await tx.joinRequest.update({
        where: { id: joinRequest.id },
        data: { status, reviewed_at: new Date() },
      });

      if (status === 'approved') {
        await tx.communityMember.upsert({
          where: {
            community_id_user_id: { community_id: communityId, user_id: joinRequest.user_id },
          },
          update: {},
          create: {
            community_id: communityId,
            user_id: joinRequest.user_id,
          },
        });
      }

      return updated;
    });

    res.status(200).json({ request: updatedRequest });
  } catch (error) {
    next(error);
  }
}

export default {  communityRequest, createCommunityRequest, handlerequest };
