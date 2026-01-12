export interface BlockRequest {
  blockedUserId: string;
}

export interface BlockResponse {
  success: boolean;
  message: string;
  data?: {
    id: string;
    blocker_id: string;
    blocked_id: string;
    created_at: Date;
    blocked?: {
      id: string;
      username: string;
      avatar_url: string | null;
    };
  };
}

export interface BlockedUser {
  id: string;
  username: string;
  avatar: string | null;
  blockedAt: Date;
  blockId: string;
}

export interface BlockListResponse {
  success: boolean;
  data: BlockedUser[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface BlockStatus {
  isBlocked: boolean;
  youBlockedThem: boolean;
  theyBlockedYou: boolean;
}
