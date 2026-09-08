import prisma from "../config/prismaClient";

/**
 * Finds the 1:1 (non-group) conversation between two users, creating it if it
 * does not exist yet. Extracted so story replies and story shares share one
 * implementation.
 */
export async function getOrCreateDirectConversation(userA: string, userB: string) {
  const existing = await prisma.conversation.findFirst({
    where: {
      is_group: false,
      AND: [
        { participants: { some: { user_id: userA } } },
        { participants: { some: { user_id: userB } } },
      ],
    },
    include: { participants: true },
  });

  const isPair =
    existing && existing.participants.length === 2 &&
    existing.participants.every((p) => p.user_id === userA || p.user_id === userB);

  if (isPair) return existing;

  return prisma.conversation.create({
    data: {
      is_group: false,
      participants: {
        create: [{ user_id: userA }, { user_id: userB }],
      },
    },
    include: { participants: true },
  });
}
