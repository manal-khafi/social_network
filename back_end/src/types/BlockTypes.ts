export interface BlockRequest {
  blockedUserId: string;
}

// 1) what the API returns for a blocked user in list
export interface BlockedUserDTO {
  id: string;
  username: string;
  display_name?: string;
  avatar_url: string | null;
  blocked_at: string; // ISO string from backend
}

// 2) list response
export interface BlockListResponse {
  success: boolean;
  data: BlockedUserDTO[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

// 3) single block returned after block/unblock
export interface BlockRecordDTO {
  id: string;
  blocker_id: string;
  blocked_id: string;
  created_at: string; // ISO string
  blocked?: {
    id: string;
    username: string;
    avatar_url: string | null;
  };
}

export interface BlockResponse {
  success: boolean;
  message: string;
  data?: BlockRecordDTO;
}

// 4) check status
export interface BlockStatus {
  isBlocked: boolean;
  youBlockedThem: boolean;
  theyBlockedYou: boolean;
}
