import { Request, Response } from "express";
import prisma from "../../config/prismaClient";
import { verifyAccessToken } from "../../util/jwt";
import { getBlockedUserIds } from "../../services/BlockService";

export const searchAccounts = async (req: Request, res: Response) => {
  try {
    const rawQuery = String(req.query.q ?? "").trim();
    if (!rawQuery) {
      return res.status(200).json({ accounts: [] });
    }

    const limitParam = Number(req.query.limit);
    const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 50) : 20;

    const authHeader = req.headers.authorization;
    let viewerId: string | null = null;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      try {
        const decoded = verifyAccessToken(token) as { id: string };
        viewerId = decoded.id;
      } catch {
        viewerId = null;
      }
    }

    const blockedIds = viewerId ? await getBlockedUserIds(viewerId) : [];

    let followingIds = new Set<string>();
    let pendingIds = new Set<string>();
    if (viewerId) {
      const follows = await prisma.follow.findMany({
        where: { follower_id: viewerId, status: { in: ["accepted", "pending"] } },
        select: { followed_id: true, status: true },
      });
      follows.forEach((f: { followed_id: string; status: string }) => {
        if (f.status === "accepted") followingIds.add(f.followed_id);
        if (f.status === "pending") pendingIds.add(f.followed_id);
      });
    }

    const users = await prisma.user.findMany({
      where: {
        is_active: true,
        id: blockedIds.length > 0 ? { notIn: blockedIds } : undefined,
        OR: [
          { username: { contains: rawQuery, mode: "insensitive" } },
          { display_name: { contains: rawQuery, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        username: true,
        display_name: true,
        avatar_url: true,
        is_private: true,
      },
      take: limit * 2,
      orderBy: { username: "asc" },
    });

    const accounts = users
      .map((u) => ({
        id: u.id,
        username: u.username,
        display_name: u.display_name,
        avatar_url: u.avatar_url,
        is_private: u.is_private,
        isFollowing: viewerId ? followingIds.has(u.id) : false,
        followRequestPending: viewerId ? pendingIds.has(u.id) : false,
      }))
      .sort((a, b) => {
        const rankA = a.isFollowing ? 2 : a.followRequestPending ? 1 : 0;
        const rankB = b.isFollowing ? 2 : b.followRequestPending ? 1 : 0;
        if (rankA !== rankB) return rankB - rankA;
        return a.username.localeCompare(b.username);
      })
      .slice(0, limit);

    return res.status(200).json({ accounts });
  } catch (error) {
    return res.status(500).json({ message: "Server error while searching accounts" });
  }
};
