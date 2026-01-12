import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  username: string;
  avatar?: string;
  content: string;
  likes: number;
  isLiked: boolean;
  timestamp: string;
  replies?: Comment[];
}

export interface Post {
  id: string;
  userId: string;
  username: string;
  avatar?: string;
  content: string;
  images?: string[];
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  isLiked: boolean;
  isSaved: boolean;
  isReposted: boolean;
  isArchived: boolean;
  timestamp: string;
  commentsAllowed: boolean;
  likesVisible: boolean;
  originalPost?: {
    id: string;
    username: string;
    content: string;
  };
}

interface PostsState {
  feed: Post[];
  savedPosts: Post[];
  archivedPosts: Post[];
  userPosts: { [userId: string]: Post[] };
  postComments: { [postId: string]: Comment[] };
}

const mockPosts: Post[] = [
  {
    id: '1',
    userId: '2',
    username: 'jane_smith',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
    content: 'Just captured this amazing sunset! 🌅 The colors were absolutely breathtaking.',
    images: ['https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800'],
    likes: 234,
    comments: 45,
    shares: 12,
    saves: 67,
    isLiked: false,
    isSaved: false,
    isReposted: false,
    isArchived: false,
    timestamp: '2h ago',
    commentsAllowed: true,
    likesVisible: true,
  },
  {
    id: '2',
    userId: '3',
    username: 'mike_wilson',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    content: 'Morning workout done! 💪 Remember, consistency is key. #fitness #motivation',
    likes: 456,
    comments: 23,
    shares: 8,
    saves: 34,
    isLiked: false,
    isSaved: false,
    isReposted: false,
    isArchived: false,
    timestamp: '4h ago',
    commentsAllowed: true,
    likesVisible: true,
  },
];

const initialState: PostsState = {
  feed: mockPosts,
  savedPosts: [],
  archivedPosts: [],
  userPosts: {},
  postComments: {
    '1': [
      {
        id: 'c1',
        postId: '1',
        userId: '3',
        username: 'mike_wilson',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
        content: 'Absolutely stunning! 😍',
        likes: 5,
        isLiked: false,
        timestamp: '1h ago',
        replies: [
          {
            id: 'r1',
            postId: '1',
            userId: '2',
            username: 'jane_smith',
            avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
            content: 'Thank you! 🙏',
            likes: 2,
            isLiked: false,
            timestamp: '45m ago',
            replies: [],
          },
        ],
      },
      {
        id: 'c2',
        postId: '1',
        userId: '1',
        username: 'john_doe',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400',
        content: 'Great shot! What camera did you use?',
        likes: 1,
        isLiked: true,
        timestamp: '30m ago',
        replies: [],
      },
    ],
    '2': [
      {
        id: 'c3',
        postId: '2',
        userId: '2',
        username: 'jane_smith',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
        content: 'So inspiring! 💪',
        likes: 8,
        isLiked: false,
        timestamp: '3h ago',
        replies: [],
      },
    ],
  },
};

const postsSlice = createSlice({
  name: 'posts',
  initialState,
  reducers: {
    addPost: (state, action: PayloadAction<Omit<Post, 'id' | 'timestamp' | 'likes' | 'comments' | 'shares' | 'saves'>>) => {
      const newPost: Post = {
        ...action.payload,
        id: Date.now().toString(),
        timestamp: 'Just now',
        likes: 0,
        comments: 0,
        shares: 0,
        saves: 0,
        isLiked: false,
        isSaved: false,
        isReposted: false,
        isArchived: false,
      };
      state.feed.unshift(newPost);
    },
    toggleLike: (state, action: PayloadAction<string>) => {
      const post = state.feed.find(p => p.id === action.payload);
      if (post) {
        post.isLiked = !post.isLiked;
        post.likes += post.isLiked ? 1 : -1;
      }
    },
    toggleSave: (state, action: PayloadAction<string>) => {
      const post = state.feed.find(p => p.id === action.payload);
      if (post) {
        post.isSaved = !post.isSaved;
        post.saves += post.isSaved ? 1 : -1;
        if (post.isSaved) {
          state.savedPosts.push(post);
        } else {
          state.savedPosts = state.savedPosts.filter(p => p.id !== post.id);
        }
      }
    },
    repostPost: (state, action: PayloadAction<string>) => {
      const originalPost = state.feed.find(p => p.id === action.payload);
      if (originalPost && !originalPost.isReposted) {
        const repost: Post = {
          ...originalPost,
          id: Date.now().toString(),
          userId: '1',
          username: 'john_doe',
          avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400',
          timestamp: 'Just now',
          originalPost: {
            id: originalPost.id,
            username: originalPost.username,
            content: originalPost.content,
          },
        };
        state.feed.unshift(repost);
        originalPost.isReposted = true;
        originalPost.shares += 1;
      }
    },
    addComment: (state, action: PayloadAction<{ postId: string; content: string }>) => {
      const { postId, content } = action.payload;
      const post = state.feed.find(p => p.id === postId);
      
      if (post) {
        const newComment: Comment = {
          id: Date.now().toString(),
          postId,
          userId: '1',
          username: 'john_doe',
          avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400',
          content,
          likes: 0,
          isLiked: false,
          timestamp: 'Just now',
          replies: [],
        };

        if (!state.postComments[postId]) {
          state.postComments[postId] = [];
        }
        state.postComments[postId].push(newComment);
        post.comments += 1;
      }
    },
    toggleCommentLike: (state, action: PayloadAction<{ postId: string; commentId: string }>) => {
      const comments = state.postComments[action.payload.postId];
      if (comments) {
        const comment = comments.find(c => c.id === action.payload.commentId);
        if (comment) {
          comment.isLiked = !comment.isLiked;
          comment.likes += comment.isLiked ? 1 : -1;
        }
      }
    },
    addReply: (state, action: PayloadAction<{ postId: string; commentId: string; content: string }>) => {
      const { postId, commentId, content } = action.payload;
      const comments = state.postComments[postId];
      
      if (comments) {
        const parentComment = comments.find(c => c.id === commentId);
        if (parentComment) {
          const newReply: Comment = {
            id: Date.now().toString(),
            postId,
            userId: '1',
            username: 'john_doe',
            avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400',
            content,
            likes: 0,
            isLiked: false,
            timestamp: 'Just now',
            replies: [],
          };
          
          if (!parentComment.replies) {
            parentComment.replies = [];
          }
          parentComment.replies.push(newReply);
          
          const post = state.feed.find(p => p.id === postId);
          if (post) {
            post.comments += 1;
          }
        }
      }
    },
    toggleReplyLike: (state, action: PayloadAction<{ postId: string; commentId: string; replyId: string }>) => {
      const comments = state.postComments[action.payload.postId];
      if (comments) {
        const comment = comments.find(c => c.id === action.payload.commentId);
        if (comment?.replies) {
          const reply = comment.replies.find(r => r.id === action.payload.replyId);
          if (reply) {
            reply.isLiked = !reply.isLiked;
            reply.likes += reply.isLiked ? 1 : -1;
          }
        }
      }
    },
    archivePost: (state, action: PayloadAction<string>) => {
      const post = state.feed.find(p => p.id === action.payload);
      if (post && post.userId === '1') {
        post.isArchived = true;
        state.archivedPosts.push(post);
        state.feed = state.feed.filter(p => p.id !== action.payload);
      }
    },
    unarchivePost: (state, action: PayloadAction<string>) => {
      const post = state.archivedPosts.find(p => p.id === action.payload);
      if (post) {
        post.isArchived = false;
        state.feed.unshift(post);
        state.archivedPosts = state.archivedPosts.filter(p => p.id !== action.payload);
      }
    },
    toggleCommentsAllowed: (state, action: PayloadAction<string>) => {
      const post = state.feed.find(p => p.id === action.payload);
      if (post && post.userId === '1') {
        post.commentsAllowed = !post.commentsAllowed;
      }
    },
    toggleLikesVisible: (state, action: PayloadAction<string>) => {
      const post = state.feed.find(p => p.id === action.payload);
      if (post && post.userId === '1') {
        post.likesVisible = !post.likesVisible;
      }
    },
  },
});

export const {
  addPost,
  toggleLike,
  toggleSave,
  repostPost,
  addComment,
  toggleCommentLike,
  addReply,
  toggleReplyLike,
  archivePost,
  unarchivePost,
  toggleCommentsAllowed,
  toggleLikesVisible,
} = postsSlice.actions;
export default postsSlice.reducer;