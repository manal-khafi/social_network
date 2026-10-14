import { Request, Response, NextFunction } from "express";
import prisma from "../../config/prismaClient";
import { publicUserSelect } from "../../util/publicUser";
import { requireCommunityAdmin } from "./communityAccess";

const getCommunityMembers = async (req: Request, res: Response, next: NextFunction) => {
  const communityId = (req.params.communityId as string);

  try {
    const members = await prisma.communityMember.findMany({
      where: { community_id: communityId },
      include: { user: { select: publicUserSelect } },
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
    const access = await requireCommunityAdmin(req, res, communityId);
    if (!access) return;

    if (!role || typeof role !== "string") {
      return res.status(400).json({ status: "error", message: "role is required" });
    }

    const targetRole = await prisma.role.findUnique({
      where: { id: role },
      select: { name: true },
    });
    if (!targetRole) {
      return res.status(400).json({ status: "error", message: "Invalid role" });
    }

    // Only the creator may hand out the OWNER role or change their own role.
    if (!access.isOwner && (targetRole.name === "OWNER" || userId === access.community.created_by)) {
      return res.status(403).json({
        status: "error",
        message: "Forbidden: only the community owner can do this",
      });
    }

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
      include: { user: { select: publicUserSelect } },
    });

    res.status(200).json({ member });
  } catch (error) {
    next(error);
  }
}

// Used both to leave a community (target = the caller) and to kick a member
// (target = someone else, owner/admin only).
const DeleteCommunityMember = async (req: Request, res: Response, next: NextFunction) => {
  const communityId = (req.params.communityId as string);
  const userId = (req.params.userId as string);

  try {
    const requesterId = req.user?.id;
    if (!requesterId) {
      return res.status(401).json({ status: "error", message: "Not authenticated" });
    }

    if (userId !== requesterId) {
      const access = await requireCommunityAdmin(req, res, communityId);
      if (!access) return;

      if (userId === access.community.created_by && !access.isOwner) {
        return res.status(403).json({
          status: "error",
          message: "Forbidden: the community owner cannot be removed",
        });
      }
    }

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
