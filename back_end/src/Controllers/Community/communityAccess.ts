import { Request, Response } from "express";
import prisma from "../../config/prismaClient";

// Community-level roles (CommunityMember.role) allowed to manage a community.
const COMMUNITY_ADMIN_ROLES = ["OWNER", "ADMIN"];

export interface CommunityAccess {
  community: { id: string; created_by: string };
  userId: string;
  /** The user created the community. */
  isOwner: boolean;
  /** The user is the creator or an active member with the OWNER/ADMIN role. */
  canManage: boolean;
}

export const getCommunityAccess = async (
  communityId: string,
  userId: string
): Promise<CommunityAccess | null> => {
  const community = await prisma.community.findUnique({
    where: { id: communityId },
    select: { id: true, created_by: true },
  });
  if (!community) return null;

  const isOwner = community.created_by === userId;
  let canManage = isOwner;

  if (!canManage) {
    const membership = await prisma.communityMember.findUnique({
      where: { community_id_user_id: { community_id: communityId, user_id: userId } },
      select: { status: true, role: { select: { name: true } } },
    });
    canManage =
      membership?.status === "active" &&
      !!membership.role &&
      COMMUNITY_ADMIN_ROLES.includes(membership.role.name);
  }

  return { community, userId, isOwner, canManage };
};

/**
 * Resolves the caller's rights on a community and sends the 401/404/403
 * response itself when they may not manage it. Returns null in that case, so
 * callers just `if (!access) return;`.
 */
export const requireCommunityAdmin = async (
  req: Request,
  res: Response,
  communityId: string
): Promise<CommunityAccess | null> => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ status: "error", message: "Not authenticated" });
    return null;
  }

  const access = await getCommunityAccess(communityId, userId);
  if (!access) {
    res.status(404).json({ status: "error", message: "Community not found" });
    return null;
  }

  if (!access.canManage) {
    res.status(403).json({
      status: "error",
      message: "Forbidden: only the community owner or an admin can do this",
    });
    return null;
  }

  return access;
};
