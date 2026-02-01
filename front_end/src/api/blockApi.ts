import api from "./axios";

export interface BlockedUser {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  blocked_at: string;
}

export interface BlockStatus {
  isBlocked: boolean;
  blockedByMe: boolean;
  blockedByThem: boolean;
}

export interface BlockedUsersResponse {
  users: BlockedUser[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Bloquer un utilisateur
export const blockUser = async (targetUserId: string): Promise<void> => {
  await api.post("/block", { targetUserId });
};

// Débloquer un utilisateur
export const unblockUser = async (targetUserId: string): Promise<void> => {
  await api.post("/unblock", { targetUserId });
};

// check if an user is blocked
export const checkBlockStatus = async (
  targetUserId: string,
): Promise<{ isBlocked: boolean }> => {
  const response = await api.get(`/check/${targetUserId}`);
  return response.data;
};

// Obtenir le statut détaillé du blocage
export const getBlockStatus = async (
  targetUserId: string,
): Promise<BlockStatus> => {
  const response = await api.get(`/status/${targetUserId}`);
  return response.data;
};

// Obtenir la liste des utilisateurs bloqués (avec pagination)
export const getBlockedUsers = async (
  page: number = 1,
  limit: number = 20,
): Promise<BlockedUsersResponse> => {
  const response = await api.get("/blocked-users", {
    params: { page, limit },
  });
  return response.data;
};

// Obtenir le nombre d'utilisateurs bloqués
export const getBlockedCount = async (): Promise<{ count: number }> => {
  const response = await api.get("/blocked-count");
  return response.data;
};
