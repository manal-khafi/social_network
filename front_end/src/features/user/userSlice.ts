import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

export interface User {
  id: string;
  username: string;
  fullName: string;
  bio: string;
  avatar?: string;
  coverImage?: string;
  isPublic: boolean;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  isFollowing?: boolean;
  isFollowedBy?: boolean;
  followRequestPending?: boolean;
  isBlocked?: boolean;
}

interface UserState {
  currentUser: User | null;
  viewedUser: User | null;
  followers: User[];
  following: User[];
  blockedUsers: User[];
  suggestedUsers: User[];
  followRequests: User[];
}

const initialState: UserState = {
  currentUser: {
    id: '1',
    username: 'john_doe',
    fullName: 'John Doe',
    bio: 'Digital creator | Photography enthusiast 📸',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400',
    coverImage: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200',
    isPublic: true,
    followersCount: 1234,
    followingCount: 567,
    postsCount: 89,
  },
  viewedUser: null,
  followers: [],
  following: [],
  blockedUsers: [],
  followRequests: [
    {
      id: '4',
      username: 'sarah_jones',
      fullName: 'Sarah Jones',
      bio: 'Artist & Designer',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
      isPublic: false,
      followersCount: 890,
      followingCount: 345,
      postsCount: 67,
    },
    {
      id: '5',
      username: 'alex_brown',
      fullName: 'Alex Brown',
      bio: 'Music producer',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
      isPublic: false,
      followersCount: 2340,
      followingCount: 456,
      postsCount: 123,
    },
  ],
  suggestedUsers: [
    {
      id: '2',
      username: 'jane_smith',
      fullName: 'Jane Smith',
      bio: 'Travel blogger',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
      isPublic: true,
      followersCount: 5678,
      followingCount: 234,
      postsCount: 156,
    },
    {
      id: '3',
      username: 'mike_wilson',
      fullName: 'Mike Wilson',
      bio: 'Fitness coach',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
      isPublic: true,
      followersCount: 3421,
      followingCount: 890,
      postsCount: 234,
    },
  ],
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setViewedUser: (state, action: PayloadAction<User>) => {
      state.viewedUser = action.payload;
    },
    updateProfile: (state, action: PayloadAction<Partial<User>>) => {
      if (state.currentUser) {
        state.currentUser = { ...state.currentUser, ...action.payload };
      }
    },
    toggleFollow: (state, action: PayloadAction<string>) => {
      if (state.viewedUser && state.viewedUser.id === action.payload) {
        // If account is private and not following, send request
        if (!state.viewedUser.isPublic && !state.viewedUser.isFollowing) {
          state.viewedUser.followRequestPending = true;
        } else {
          // For public accounts or unfollowing
          state.viewedUser.isFollowing = !state.viewedUser.isFollowing;
          state.viewedUser.followersCount += state.viewedUser.isFollowing ? 1 : -1;
          
          if (state.viewedUser.followRequestPending) {
            state.viewedUser.followRequestPending = false;
          }
        }
      }
    },
    acceptFollowRequest: (state, action: PayloadAction<string>) => {
      const userId = action.payload;
      const requestIndex = state.followRequests.findIndex(u => u.id === userId);
      if (requestIndex !== -1) {
        const user = state.followRequests[requestIndex];
        state.following.push(user);
        state.followRequests.splice(requestIndex, 1);
        if (state.currentUser) {
          state.currentUser.followersCount += 1;
        }
      }
    },
    denyFollowRequest: (state, action: PayloadAction<string>) => {
      state.followRequests = state.followRequests.filter(u => u.id !== action.payload);
    },
    togglePrivacy: (state) => {
      if (state.currentUser) {
        state.currentUser.isPublic = !state.currentUser.isPublic;
      }
    },
    blockUser: (state, action: PayloadAction<string>) => {
      const userId = action.payload;
      if (!state.blockedUsers.find(u => u.id === userId)) {
        const userToBlock = state.suggestedUsers.find(u => u.id === userId);
        if (userToBlock) {
          state.blockedUsers.push(userToBlock);
        }
      }
    },
    unblockUser: (state, action: PayloadAction<string>) => {
      state.blockedUsers = state.blockedUsers.filter(u => u.id !== action.payload);
    },
    followUser: (state, action: PayloadAction<string>) => {
      const userId = action.payload;
      const userToFollow = state.suggestedUsers.find(u => u.id === userId);
      if (userToFollow) {
        if (!userToFollow.isPublic) {
          // Send follow request
          userToFollow.followRequestPending = true;
        } else {
          // Follow immediately
          userToFollow.isFollowing = true;
          if (state.currentUser) {
            state.currentUser.followingCount += 1;
          }
        }
      }
    },
    unfollowUser: (state, action: PayloadAction<string>) => {
      const userId = action.payload;
      const userToUnfollow = state.suggestedUsers.find(u => u.id === userId);
      if (userToUnfollow) {
        userToUnfollow.isFollowing = false;
        userToUnfollow.followRequestPending = false;
        if (state.currentUser) {
          state.currentUser.followingCount -= 1;
        }
      }
    },
  },
});

export const { 
  setViewedUser, 
  updateProfile, 
  toggleFollow, 
  acceptFollowRequest, 
  denyFollowRequest, 
  togglePrivacy, 
  blockUser, 
  unblockUser,
  followUser,
  unfollowUser
} = userSlice.actions;
export default userSlice.reducer;