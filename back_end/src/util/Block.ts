/**
 * Valider que l'utilisateur ne se bloque pas lui-même
 */
export const validateSelfBlock = (
  blockerId: string,
  blockedId: string
): boolean => {
  return blockerId !== blockedId;
};

/**
 * Valider les IDs d'utilisateurs
 */
export const validateUserIds = (userId1: string, userId2: string): boolean => {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(userId1) && uuidRegex.test(userId2);
};

/**
 * Formater la réponse de blocage
 */
export const formatBlockResponse = (block: any) => {
  return {
    id: block.id,
    blocker_id: block.blocker_id,
    blocked_id: block.blocked_id,
    created_at: block.created_at,
  };
};

/**
 * Formater la liste des utilisateurs bloqués
 */
export const formatBlockedUsersList = (blocks: any[]) => {
  return blocks.map((block) => ({
    id: block.blocked.id,
    username: block.blocked.username,
    display_name: block.blocked.display_name,
    avatar_url: block.blocked.avatar_url,
    blocked_at: block.created_at,
  }));
};
