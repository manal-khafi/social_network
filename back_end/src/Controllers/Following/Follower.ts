import { Request, Response } from "express";
import prisma from "../../config/prismaClient";

type FollowWithFollower = {
  follower: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
    is_private: boolean;
    cover_image: string | null;
  };
};
type FollowedIdOnly = { followed_id: string };

const Follower = async (req: Request, res: Response) => {
  const userId = req.params.userId;
  const viewerId = req.user?.id;

  try {
    const followers: FollowWithFollower[] = await prisma.follow.findMany({
      where: {
        followed_id: userId,
        status: "accepted",
      },
      include: {
        follower: {
          select: {
            id: true,
            username: true,
            display_name: true,
            avatar_url: true,
            is_private: true,
            cover_image: true,
          },
        },
      },
      orderBy: { created_at: "desc" },
    });

    const total = await prisma.follow.count({
      where: {
        followed_id: userId,
        status: "accepted",
      },
    });

    const followerIds = followers.map((f) => f.follower.id);
    let viewerFollowingIds = new Set<string>();

    if (viewerId && followerIds.length > 0) {
      const viewerFollows: FollowedIdOnly[] = await prisma.follow.findMany({
        where: {
          follower_id: viewerId,
          followed_id: { in: followerIds },
          status: "accepted",
        },
        select: { followed_id: true },
      });
      viewerFollowingIds = new Set(viewerFollows.map((f) => f.followed_id));
    }

    const users = followers.map((f) => ({
      id: f.follower.id,
      username: f.follower.username,
      display_name: f.follower.display_name,
      avatar_url: f.follower.avatar_url,
      is_private: f.follower.is_private,
      cover_image: f.follower.cover_image ?? null,
      isFollowing: viewerFollowingIds.has(f.follower.id),
    }));

    res.status(200).json({ total, users });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

export default Follower;
