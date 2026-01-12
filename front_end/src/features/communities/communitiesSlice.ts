import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

export interface Community {
  id: string;
  name: string;
  description: string;
  image?: string;
  membersCount: number;
  postsCount: number;
  isPublic: boolean;
  isJoined: boolean;
  isRequestPending?: boolean;
}

interface CommunitiesState {
  trending: Community[];
  joined: Community[];
  suggested: Community[];
}

const initialState: CommunitiesState = {
  trending: [
    {
      id: '1',
      name: 'Photography',
      description: 'Share your best shots',
      image: 'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=400',
      membersCount: 12543,
      postsCount: 8934,
      isPublic: true,
      isJoined: false,
    },
    {
      id: '2',
      name: 'Travel',
      description: 'Explore the world together',
      image: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400',
      membersCount: 23456,
      postsCount: 15678,
      isPublic: true,
      isJoined: true,
    },
  ],
  joined: [],
  suggested: [],
};

const communitiesSlice = createSlice({
  name: 'communities',
  initialState,
  reducers: {
    joinCommunity: (state, action: PayloadAction<string>) => {
      const community = state.trending.find(c => c.id === action.payload) ||
                       state.suggested.find(c => c.id === action.payload);
      if (community) {
        if (community.isPublic) {
          community.isJoined = true;
          community.membersCount += 1;
          state.joined.push(community);
        } else {
          community.isRequestPending = true;
        }
      }
    },
    leaveCommunity: (state, action: PayloadAction<string>) => {
      const community = state.trending.find(c => c.id === action.payload) ||
                       state.joined.find(c => c.id === action.payload);
      if (community) {
        community.isJoined = false;
        community.membersCount -= 1;
        state.joined = state.joined.filter(c => c.id !== action.payload);
      }
    },
  },
});

export const { joinCommunity, leaveCommunity } = communitiesSlice.actions;
export default communitiesSlice.reducer;
