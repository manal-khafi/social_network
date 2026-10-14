export interface Member {
  id: string;
  userId?: string;
  name?: string;
  username?: string;
  followers?: number;
  avatar?: string;
  isVerified?: boolean;
  user?: {
    id: string;
    username: string;
    display_name?: string;
    avatar_url?: string | null;
    is_verified?: boolean;
  };
  joinedAt?: string;
  role?: string;
}

export interface Community {
  id: string;
  name: string;
  bio?: string;
  description?: string;
  avatar_url?: string;
  banner_url?: string;
  _count?: {
    members: number;
  };
  type?: string;
  createdAt?: string;
  is_private?: boolean;
  allow_posts?: boolean;
  require_approval?: boolean;
}

export interface JoinRequest {
  id: string;
  user_id: string;
  community_id: string;
  message?: string;
  status: string;
  created_at: string;
  user?: {
    id: string;
    username: string;
    display_name: string;
    email: string;
    avatar_url?: string;
  };
}

export interface CommunityRule {
  id: string;
  title: string;
  description: string;
  order: number;
  community_id: string;
  created_at: string;
  updated_at: string;
}
