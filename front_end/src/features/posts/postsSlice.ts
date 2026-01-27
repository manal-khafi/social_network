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
  parent_comment_id?: string | null;
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
  isEdited?: boolean;
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
  return response.data.posts as Post[];
});

export const createPost = createAsyncThunk(
  'posts/createPost',
  async (
    payload: {
      content: string;
      media_urls?: string[];
      visibility?: 'public' | 'private' | 'friends';
    }
  ) => {
    const response = await api.post('/posts', payload);
    return response.data.post as Post;
  }
);

export const togglePostLike = createAsyncThunk(
  'posts/togglePostLike',
  async (postId: string) => {
    const response = await api.post(`/posts/${postId}/like`);
    return { 
      postId, 
      liked: response.data.liked as boolean,
      likes: response.data.likes as number | undefined
    };
  }
);

export const togglePostSave = createAsyncThunk(
  'posts/togglePostSave',
  async (postId: string) => {
    const response = await api.post(`/posts/${postId}/save`);
    return { 
      postId, 
      saved: response.data.saved as boolean,
      saves: response.data.saves as number | undefined
    };
  }
);

export const togglePostRepost = createAsyncThunk(
  'posts/togglePostRepost',
  async (postId: string) => {
    const response = await api.post(`/posts/${postId}/repost`);
    return { 
      postId, 
      reposted: response.data.reposted as boolean,
      shares: response.data.shares as number | undefined
    };
  }
);

export const fetchComments = createAsyncThunk(
  'posts/fetchComments',
  async (postId: string) => {
    const response = await api.get(`/comments/${postId}`);
    return { postId, comments: response.data.comments as Comment[] };
  }
);

export const createComment = createAsyncThunk(
  'posts/createComment',
  async (payload: { postId: string; content: string; parent_comment_id?: string | null }) => {
    const response = await api.post(`/comments/${payload.postId}`, {
      content: payload.content,
      parent_comment_id: payload.parent_comment_id ?? null,
    });
    return { postId: payload.postId, comment: response.data.comment as Comment };
  }
);

export const toggleCommentLike = createAsyncThunk(
  'posts/toggleCommentLike',
  async (payload: { postId: string; commentId: string }) => {
    const response = await api.post(`/comments/like/${payload.commentId}`);
    return { postId: payload.postId, commentId: payload.commentId, liked: response.data.liked as boolean };
  }
);

export const updatePost = createAsyncThunk(
  'posts/updatePost',
  async (payload: { postId: string; content: string; media_urls?: string[] }) => {
    const response = await api.put(`/posts/${payload.postId}`, {
      content: payload.content,
      media_urls: payload.media_urls,
    });
    return response.data.post as Post;
  }
);

export const deletePost = createAsyncThunk(
  'posts/deletePost',
  async (postId: string) => {
    await api.delete(`/posts/${postId}`);
    return postId;
  }
);

const postsSlice = createSlice({
  name: 'posts',
  initialState,
  reducers: {
    addPost: (state, action: PayloadAction<Post>) => {
      state.feed.unshift(action.payload);
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
      if (originalPost) {
        originalPost.isReposted = !originalPost.isReposted;
        originalPost.shares += originalPost.isReposted ? 1 : -1;
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
      })
      .addCase(createPost.fulfilled, (state, action) => {
        state.feed.unshift(action.payload);
      })
      .addCase(createPost.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to create post';
      })
      .addCase(togglePostLike.fulfilled, (state, action) => {
        const post = state.feed.find(p => p.id === action.payload.postId);
        if (post) {
          post.isLiked = action.payload.liked;
          if (action.payload.likes !== undefined) {
            post.likes = action.payload.likes;
          } else {
            post.likes += action.payload.liked ? 1 : -1;
          }
        }
      })
      .addCase(togglePostSave.fulfilled, (state, action) => {
        const post = state.feed.find(p => p.id === action.payload.postId);
        if (post) {
          post.isSaved = action.payload.saved;
          if (action.payload.saves !== undefined) {
            post.saves = action.payload.saves;
          } else {
            post.saves += action.payload.saved ? 1 : -1;
          }
          if (post.isSaved) {
            if (!state.savedPosts.find(p => p.id === post.id)) {
              state.savedPosts.push(post);
            }
          } else {
            state.savedPosts = state.savedPosts.filter(p => p.id !== post.id);
          }
        }
      })
      .addCase(togglePostRepost.fulfilled, (state, action) => {
        const post = state.feed.find(p => p.id === action.payload.postId);
        if (post) {
          post.isReposted = action.payload.reposted;
          if (action.payload.shares !== undefined) {
            post.shares = action.payload.shares;
          } else {
            post.shares += action.payload.reposted ? 1 : -1;
          }
        }
      })
      .addCase(fetchComments.fulfilled, (state, action) => {
        state.postComments[action.payload.postId] = action.payload.comments;
      })
      .addCase(createComment.fulfilled, (state, action) => {
        const { postId, comment } = action.payload;
        if (!state.postComments[postId]) {
          state.postComments[postId] = [];
        }
        if (comment.parent_comment_id) {
          const stack = [...state.postComments[postId]];
          while (stack.length > 0) {
            const current = stack.shift();
            if (!current) continue;
            if (current.id === comment.parent_comment_id) {
              current.replies = current.replies ?? [];
              current.replies.push(comment);
              break;
            }
            if (current.replies && current.replies.length > 0) {
              stack.push(...current.replies);
            }
          }
        } else {
          state.postComments[postId].push(comment);
        }
        const post = state.feed.find(p => p.id === postId);
        if (post) post.comments += 1;
      })
      .addCase(toggleCommentLike.fulfilled, (state, action) => {
        const comments = state.postComments[action.payload.postId];
        if (!comments) return;
        const stack = [...comments];
        while (stack.length > 0) {
          const current = stack.shift();
          if (!current) continue;
          if (current.id === action.payload.commentId) {
            current.isLiked = action.payload.liked;
            current.likes += action.payload.liked ? 1 : -1;
            break;
          }
          if (current.replies && current.replies.length > 0) {
            stack.push(...current.replies);
          }
        }
      })
      .addCase(updatePost.fulfilled, (state, action) => {
        const index = state.feed.findIndex(p => p.id === action.payload.id);
        if (index !== -1) {
          state.feed[index] = action.payload;
        }
      })
      .addCase(deletePost.fulfilled, (state, action) => {
        state.feed = state.feed.filter(p => p.id !== action.payload);
      });
  },
});

export const {
  addPost,
  toggleLike,
  toggleSave,
  repostPost,
  archivePost,
  unarchivePost,
} = postsSlice.actions;
export default postsSlice.reducer;
