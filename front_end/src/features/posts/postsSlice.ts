import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import api from '../../api/axios';

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
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: PostsState = {
  feed: [],
  savedPosts: [],
  archivedPosts: [],
  userPosts: {},
  postComments: {},
  status: 'idle',
  error: null,
};

export const fetchPosts = createAsyncThunk('posts/fetchPosts', async () => {
  const response = await api.get('/posts');
  return response.data;
});

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
          userId: '1', // TODO: Get from auth state
          username: 'current_user', // TODO: Get from auth state
          avatar: '',
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
          userId: '1', // TODO: Get from auth state
          username: 'current_user',
          avatar: '',
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
            username: 'current_user',
            avatar: '',
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
      if (post) {
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
      if (post) {
        post.commentsAllowed = !post.commentsAllowed;
      }
    },
    toggleLikesVisible: (state, action: PayloadAction<string>) => {
      const post = state.feed.find(p => p.id === action.payload);
      if (post) {
        post.likesVisible = !post.likesVisible;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPosts.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchPosts.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.feed = action.payload;
      })
      .addCase(fetchPosts.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message || 'Failed to fetch posts';
      });
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
