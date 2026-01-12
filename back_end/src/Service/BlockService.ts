import { prisma } from "@/config/PrismaBlock";

/**
 * Validation commune
 */

const validateBlockAction = (blockerId: string, blockedId: string) => {
  if (!blockerId || !blockedId) {
    throw new Error("Les identifiants de blocage sont requis");
  }

  if (blockerId === blockedId) {
    throw new Error("Vous ne pouvez pas vous bloquer vous-même");
  }
};
/**
 * Bloquer un utilisateur
 */
export const blockUser = async (blockerId: string, blockedId: string) => {
  validateBlockAction(blockerId, blockedId);
  const alredayBlocked = await prisma.block.findFirst({
    where: {
      blocker_id_blocked_id: {
        blocker_id: blockerId,
        blocked_id: blockedId,
      },
    },
  });

  if (alredayBlocked) {
    throw new Error("Cet utilisateur est déjà bloqué");
  }
  return prisma.$transaction(async (tx: any) => {
    // 1. Créer le blocage
    const block = await tx.block.create({
      data: {
        blocker_id: blockerId,
        blocked_id: blockedId,
      },
      include: {
        blocked: {
          select: {
            id: true,
            username: true,
            avatar_url: true,
          },
        },
      },
    });
    // 2. Supprimer les follows dans les deux sens
    await tx.follow.deleteMany({
      where: {
        OR: [
          { follower_id: blockerId, followed_id: blockedId },
          { follower_id: blockedId, followed_id: blockerId },
        ],
      },
    });
    return block;
  });
};
/**
 * Débloquer un utilisateur
 */
export const unblockUser = async (blockerId: string, blockedId: string) => {
  validateBlockAction(blockerId, blockedId);
  const block = await prisma.block.findUnique({
    where: {
      blocker_id_blocked_id: {
        blocker_id: blockerId,
        blocked_id: blockedId,
      },
    },
  });
  if (!block) {
    throw new Error("Aucun blocage trouvé pour cet utilisateur");
  }
  await prisma.block.delete({
    where: {
      id: block.id,
    },
  });
  return { success: true };
};

/**
 * Vérifier si deux utilisateurs sont bloqués (dans un sens ou l'autre)
 */

export const isBlocked = async (
  userId: string,
  targetUserId: string
): Promise<boolean> => {
  const block = await prisma.block.findFirst({
    where: {
      OR: [
        { blocker_id: userId, blocked_id: targetUserId },
        { blocker_id: targetUserId, blocked_id: userId },
      ],
    },
  });

  return block > 0;
};

/**
 * Obtenir le statut détaillé du blocage
 */
export const getBlockStatus = async (userId: string, targetUserId: string) => {
  const blocks = await prisma.block.findMany({
    where: {
      OR: [
        { blocker_id: userId, blocked_id: targetUserId },
        { blocker_id: targetUserId, blocked_id: userId },
      ],
    },
  });

  return {
    isBlocked: blocks.length > 0,
    youBlockedThem: blocks.some((block: any) => block.blocker_id === userId),
    theyBlockedYou: blocks.some(
      (block: any) => block.blocker_id === targetUserId
    ),
  };
};

/**
 * Liste des utilisateurs bloqués avec pagination
 */
export const getBlockedUsers = async (userId: string, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;

  const [blocks, total] = await Promise.all([
    prisma.block.findMany({
      where: {
        blocker_id: userId,
      },
      include: {
        blocked: {
          select: {
            id: true,
            username: true,
            avatar_url: true,
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
      skip,
      take: limit,
    }),
    prisma.block.count({
      where: {
        blocker_id: userId,
      },
    }),
  ]);

  return {
    blockedUsers: blocks.map((block: any) => ({
      id: block.blocked.id,
      username: block.blocked.username,
      avatar: block.blocked.avatar_url,
      blockedAt: block.created_at,
      blockId: block.id,
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page < Math.ceil(total / limit),
      hasPrevPage: page > 1,
    },
  };
};

/**
 * Obtenir le nombre d'utilisateurs bloqués
 */
export const getBlockedCount = async (userId: string): Promise<number> => {
  return prisma.block.count({
    where: {
      blocker_id: userId,
    },
  });
};
