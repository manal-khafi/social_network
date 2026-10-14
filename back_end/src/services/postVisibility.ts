import type { Prisma } from "@prisma/client";
import prisma from "../config/prismaClient";

/**
 * Single source of truth for "may this viewer see this post?".
 *
 *   - deleted posts: nobody
 *   - the author always sees their own posts (archived, private, ...)
 *   - archived posts: author only
 *   - posts of a private account: accepted followers only
 *   - visibility "public":  everyone (subject to the account rule above)
 *   - visibility "friends": mutual followers of the author (the viewer
 *     follows the author AND the author follows back), or anyone the author
 *     put in their close-friends list
 *   - visibility "private": author only
 *
 * Blocking is NOT handled here; callers keep their own block filters.
 * Spread/AND the result into any `where` on Post (or a relation to Post).
 */
export const visiblePostWhere = (viewerId: string | null | undefined): Prisma.PostWhereInput => {
  // Anonymous viewer: only public posts of public accounts.
  if (!viewerId) {
    return {
      is_deleted: false,
      is_archived: false,
      visibility: "public",
      user: { is_private: false },
    };
  }

  const viewerFollowsAuthor: Prisma.UserWhereInput = {
    receivedFollows: { some: { follower_id: viewerId, status: "accepted" } },
  };
  const authorFollowsViewer: Prisma.UserWhereInput = {
    sentFollows: { some: { followed_id: viewerId, status: "accepted" } },
  };
  const viewerIsCloseFriend: Prisma.UserWhereInput = {
    closeFriends: { some: { close_friend_id: viewerId } },
  };

  return {
    is_deleted: false,
    OR: [
      { user_id: viewerId },
      {
        is_archived: false,
        AND: [
          // Account-level privacy
          { OR: [{ user: { is_private: false } }, { user: viewerFollowsAuthor }] },
          // Post-level visibility
          {
            OR: [
              { visibility: "public" },
              {
                visibility: "friends",
                user: {
                  OR: [{ AND: [viewerFollowsAuthor, authorFollowsViewer] }, viewerIsCloseFriend],
                },
              },
            ],
          },
        ],
      },
    ],
  };
};

/** True when `viewerId` is allowed to see (and so interact with) the post. */
export const canViewPost = async (
  viewerId: string | null | undefined,
  postId: string
): Promise<boolean> => {
  const post = await prisma.post.findFirst({
    where: { id: postId, AND: [visiblePostWhere(viewerId)] },
    select: { id: true },
  });
  return !!post;
};
