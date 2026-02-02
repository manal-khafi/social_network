import { Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const getCommunityMembers = async (req: Request, res: Response, next: NextFunction) => {
  const communityId = (req.params.communityId as string);

  try {
    const members = await prisma.communityMember.findMany({
      where: { community_id: communityId },
      include: { user: true },
    });

    res.status(200).json({ members });
  } catch (error) {
    next(error);
  }
}

const giveMemberRole = async (req: Request, res: Response, next: NextFunction) => {
  const { role } = req.body;
  const communityId = (req.params.communityId as string);
  const userId = (req.params.userId as string);

  try {
    const updatedMember = await prisma.communityMember.updateMany({
      where: {
        community_id: communityId,
        user_id: userId,
      },
      data: {
        role_id: role,
      },
    });

    res.status(200).json({ member: updatedMember });
  } catch (error) {
    next(error);
  }
}

const getOneCommunityMember = async (req: Request, res: Response, next: NextFunction) => {
  const communityId = (req.params.communityId as string);
  const userId = (req.params.userId as string);

  try {
    const member = await prisma.communityMember.findFirst({
      where: {
        community_id: communityId,
        user_id: userId,
      },
      include: { user: true },
    });

    res.status(200).json({ member });
  } catch (error) {
    next(error);
  }
}

const DeleteCommunityMember = async (req: Request, res: Response, next: NextFunction) => {
  const communityId = (req.params.communityId as string);
  const userId = (req.params.userId as string);

  try {
    const deletedMember = await prisma.communityMember.deleteMany({
      where: {
        community_id: communityId,
        user_id: userId,
      },
    });

    res.status(200).json({ member: deletedMember });
  } catch (error) {
    next(error);
  }
}

const checkMembershipStatus = async (req: Request, res: Response, next: NextFunction) => {
  const communityId = (req.params.communityId as string);
  const userId = (req.params.userId as string);

  try {
    const member = await prisma.communityMember.findFirst({
      where: {
        community_id: communityId,
        user_id: userId,
        status: 'active',
      },
    });

    res.status(200).json({ 
      status: "success",
      isMember: !!member,
      member: member || null,
    });
  } catch (error) {
    next(error);
  }
} 

export default {
  getCommunityMembers,
  giveMemberRole,
  getOneCommunityMember,
  DeleteCommunityMember,
  checkMembershipStatus,
};