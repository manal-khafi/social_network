import prisma from '../util/prisma';

export class RelationshipService {
  /**
   * Vérifie si deux utilisateurs sont amis (follow mutuel accepté)
   */
  static async areFriends(userId1: string, userId2: string): Promise<boolean> {
    const follow1 = await prisma.follow.findUnique({
      where: {
        follower_id_followed_id: {
          follower_id: userId1,
          followed_id: userId2,
        },
      },
    });

    const follow2 = await prisma.follow.findUnique({
      where: {
        follower_id_followed_id: {
          follower_id: userId2,
          followed_id: userId1,
        },
      },
    });

    return (
      follow1?.status === 'accepted' &&
      follow2?.status === 'accepted'
    );
  }

  /**
   * Vérifie si un utilisateur est dans la liste des amis proches d'un autre
   */
  static async isCloseFriend(userId: string, friendId: string): Promise<boolean> {
    const closeFriend = await prisma.closeFriend.findUnique({
      where: {
        user_id_close_friend_id: {
          user_id: friendId,
          close_friend_id: userId,
        },
      },
    });

    return closeFriend !== null;
  }

  /**
   * Vérifie si un utilisateur peut voir une story en fonction de sa visibilité
   */
  static async canViewStory(
    viewerId: string,
    storyOwnerId: string,
    visibility: 'public' | 'friends' | 'close_friends'
  ): Promise<boolean> {
    // L'utilisateur peut toujours voir ses propres stories
    if (viewerId === storyOwnerId) {
      return true;
    }

    // Vérifier si l'utilisateur a bloqué ou a été bloqué
    const blocked = await prisma.block.findFirst({
      where: {
        OR: [
          { blocker_id: viewerId, blocked_id: storyOwnerId },
          { blocker_id: storyOwnerId, blocked_id: viewerId },
        ],
      },
    });

    if (blocked) {
      return false;
    }

    switch (visibility) {
      case 'public':
        return true;

      case 'friends':
        return await this.areFriends(viewerId, storyOwnerId);

      case 'close_friends':
        return await this.isCloseFriend(viewerId, storyOwnerId);

      default:
        return false;
    }
  }

  /**
   * Récupère tous les IDs des utilisateurs qu'un utilisateur peut voir (amis + amis proches)
   */
  static async getVisibleUserIds(userId: string): Promise<string[]> {
    // Récupérer les amis acceptés
    const acceptedFollows = await prisma.follow.findMany({
      where: {
        OR: [
          { follower_id: userId, status: 'accepted' },
          { followed_id: userId, status: 'accepted' },
        ],
      },
      select: {
        follower_id: true,
        followed_id: true,
      },
    });

    const friendIds = new Set<string>();
    acceptedFollows.forEach((follow) => {
      if (follow.follower_id === userId) {
        friendIds.add(follow.followed_id);
      } else {
        friendIds.add(follow.follower_id);
      }
    });

    return Array.from(friendIds);
  }

  /**
   * Récupère les IDs des amis proches d'un utilisateur
   */
  static async getCloseFriendIds(userId: string): Promise<string[]> {
    const closeFriends = await prisma.closeFriend.findMany({
      where: { user_id: userId },
      select: { close_friend_id: true },
    });

    return closeFriends.map((cf) => cf.close_friend_id);
  }

  /**
   * Pré-charge en 3 requêtes tout ce qu'il faut pour filtrer un lot de stories
   * par visibilité, au lieu d'appeler canViewStory (N+1) pour chacune.
   */
  static async getStoryVisibilityContext(viewerId: string): Promise<StoryVisibilityContext> {
    const [blocks, follows, closeFriendOf] = await Promise.all([
      prisma.block.findMany({
        where: {
          OR: [{ blocker_id: viewerId }, { blocked_id: viewerId }],
        },
        select: { blocker_id: true, blocked_id: true },
      }),
      prisma.follow.findMany({
        where: {
          status: 'accepted',
          OR: [{ follower_id: viewerId }, { followed_id: viewerId }],
        },
        select: { follower_id: true, followed_id: true },
      }),
      // Owners who added the viewer to *their* close friends list.
      prisma.closeFriend.findMany({
        where: { close_friend_id: viewerId },
        select: { user_id: true },
      }),
    ]);

    const blockedIds = new Set<string>();
    for (const b of blocks) {
      blockedIds.add(b.blocker_id === viewerId ? b.blocked_id : b.blocker_id);
    }

    const outgoing = new Set<string>();
    const incoming = new Set<string>();
    for (const f of follows) {
      if (f.follower_id === viewerId) outgoing.add(f.followed_id);
      if (f.followed_id === viewerId) incoming.add(f.follower_id);
    }
    const mutualFriendIds = new Set<string>();
    for (const id of outgoing) if (incoming.has(id)) mutualFriendIds.add(id);

    const closeFriendOwnerIds = new Set<string>(
      closeFriendOf.map((c: { user_id: string }) => c.user_id)
    );

    return { blockedIds, mutualFriendIds, closeFriendOwnerIds };
  }

  /**
   * Version synchrone de canViewStory à partir d'un contexte pré-chargé.
   */
  static canViewStoryWithContext(
    ctx: StoryVisibilityContext,
    viewerId: string,
    story: { user_id: string; visibility: 'public' | 'friends' | 'close_friends' }
  ): boolean {
    if (story.user_id === viewerId) return true;
    if (ctx.blockedIds.has(story.user_id)) return false;
    switch (story.visibility) {
      case 'public':
        return true;
      case 'friends':
        return ctx.mutualFriendIds.has(story.user_id);
      case 'close_friends':
        return ctx.closeFriendOwnerIds.has(story.user_id);
      default:
        return false;
    }
  }
}

export interface StoryVisibilityContext {
  blockedIds: Set<string>;
  mutualFriendIds: Set<string>;
  closeFriendOwnerIds: Set<string>;
}

