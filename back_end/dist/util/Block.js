"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatBlockedUsersList = exports.formatBlockResponse = exports.validateUserIds = exports.validateSelfBlock = void 0;
/**
 * Valider que l'utilisateur ne se bloque pas lui-même
 */
const validateSelfBlock = (blockerId, blockedId) => {
    return blockerId !== blockedId;
};
exports.validateSelfBlock = validateSelfBlock;
/**
 * Valider les IDs d'utilisateurs
 */
const validateUserIds = (userId1, userId2) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(userId1) && uuidRegex.test(userId2);
};
exports.validateUserIds = validateUserIds;
/**
 * Formater la réponse de blocage
 */
const formatBlockResponse = (block) => {
    return {
        id: block.id,
        blocker_id: block.blocker_id,
        blocked_id: block.blocked_id,
        created_at: block.created_at,
    };
};
exports.formatBlockResponse = formatBlockResponse;
/**
 * Formater la liste des utilisateurs bloqués
 */
const formatBlockedUsersList = (blocks) => {
    return blocks.map((block) => ({
        id: block.blocked.id,
        username: block.blocked.username,
        display_name: block.blocked.display_name,
        avatar_url: block.blocked.avatar_url,
        blocked_at: block.created_at,
    }));
};
exports.formatBlockedUsersList = formatBlockedUsersList;
