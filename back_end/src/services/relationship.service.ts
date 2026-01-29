import prisma from '../utils/prisma';
import { AppError } from '../utils/errors';

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
}

