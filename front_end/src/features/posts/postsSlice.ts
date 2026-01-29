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
  username:string;
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
  myPosts: Post[];
  myReposts: Post[];
  userPosts: { [userId: string]: Post[] };
  userReposts: { [userId: string]: Post[] };
  postComments: { [postId: string]: Comment[] };
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  loadMoreStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  nextOffset: number | null;
  hasMore: boolean;
  error: string | null;
}

const initialState: PostsState = {
  feed: [],
  savedPosts: [],
  archivedPosts: [],
  myPosts: [],
  myReposts: [],
  userPosts: {},
  userReposts: {},
  postComments: {},
  status: 'idle',
  loadMoreStatus: 'idle',
  nextOffset: 0,
  hasMore: true,
  error: null,
};

const DEFAULT_LIMIT = 5;

export const fetchPosts = createAsyncThunk('posts/fetchPosts', async () => {
  const response = await api.get('/posts', { params: { limit: DEFAULT_LIMIT, offset: 0 } });
  return {
    posts: response.data.posts as Post[],
    nextOffset: response.data.nextOffset as number | null,
    hasMore: response.data.hasMore as boolean,
  };
});

export const fetchMyPosts = createAsyncThunk('posts/fetchMyPosts', async () => {
  const response = await api.get('/posts/me');
  return response.data.posts as Post[];
});

export const fetchMyReposts = createAsyncThunk('posts/fetchMyReposts', async () => {
  const response = await api.get('/posts/me/reposts');
  return response.data.reposts as Post[];
});

export const fetchSavedPosts = createAsyncThunk('posts/fetchSavedPosts', async () => {
  const response = await api.get('/posts/me/saved');
  return response.data.posts as Post[];
});

export const fetchMyArchivedPosts = createAsyncThunk('posts/fetchMyArchivedPosts', async () => {
  const response = await api.get('/posts/me/archived');
  return response.data.posts as Post[];
});

export const fetchUserPosts = createAsyncThunk(
  'posts/fetchUserPosts',
  async (userId: string, { rejectWithValue }) => {
    try {
      const response = await api.get(`/posts/user/${userId}`);
      return { userId, posts: response.data.posts as Post[] };
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message ?? 'Failed to fetch user posts');
    }
  }
);

export const fetchUserReposts = createAsyncThunk(
  'posts/fetchUserReposts',
  async (userId: string, { rejectWithValue }) => {
    try {
      const response = await api.get(`/posts/user/${userId}/reposts`);
      return { userId, reposts: response.data.reposts as Post[] };
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message ?? 'Failed to fetch user reposts');
    }
  }
);
export const fetchMorePosts = createAsyncThunk(
  'posts/fetchMorePosts',
  async (offset: number, { rejectWithValue }) => {
    try {
      const response = await api.get('/posts', { params: { limit: DEFAULT_LIMIT, offset } });
      return {
        posts: response.data.posts as Post[],
        nextOffset: response.data.nextOffset as number | null,
        hasMore: response.data.hasMore as boolean,
      };
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message ?? 'Failed to load more posts');
    }
  }
);

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

export const archivePost = createAsyncThunk(
  'posts/archivePost',
  async (postId: string) => {
    const response = await api.patch(`/posts/${postId}/archive`);
    return response.data.postId as string;
  }
);

export const unarchivePost = createAsyncThunk(
  'posts/unarchivePost',
  async (postId: string) => {
    const response = await api.patch(`/posts/${postId}/unarchive`);
    return response.data.postId as string;
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
    removePostsByUserId: (state, action: PayloadAction<string>) => {
      const userIdToRemove = action.payload;
      state.feed = state.feed.filter(post => post.userId !== userIdToRemove);
      state.savedPosts = state.savedPosts.filter(post => post.userId !== userIdToRemove);
      state.archivedPosts = state.archivedPosts.filter(post => post.userId !== userIdToRemove);
      state.myPosts = state.myPosts.filter(post => post.userId !== userIdToRemove);
      // For reposts, we need to filter originalPost.userId
      state.myReposts = state.myReposts.filter(repost => repost.originalPost?.userId !== userIdToRemove);
      // Also clear any comments related to posts by this user from postComments
      // This is a simple approach; a more granular approach would filter comments within posts
      for (const postId in state.postComments) {
        // Check if any comment in this post's comments belongs to the user being blocked
        if (state.postComments[postId].some(comment => comment.userId === userIdToRemove)) {
          delete state.postComments[postId];
        }
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
        state.feed = action.payload.posts;
        state.nextOffset = action.payload.nextOffset;
        state.hasMore = action.payload.hasMore;
        state.loadMoreStatus = 'idle';
      })
      .addCase(fetchPosts.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message || 'Failed to fetch posts';
      })
      .addCase(fetchMyPosts.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchMyPosts.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.myPosts = action.payload;
      })
      .addCase(fetchMyPosts.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message || 'Failed to fetch posts';
      })
      .addCase(fetchMyReposts.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchMyReposts.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.myReposts = action.payload;
      })
      .addCase(fetchMyReposts.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message || 'Failed to fetch reposts';
      })
      .addCase(fetchUserPosts.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchUserPosts.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.userPosts[action.payload.userId] = action.payload.posts;
      })
      .addCase(fetchUserPosts.rejected, (state, action) => {
        state.status = 'failed';
        state.error = (action.payload as string) || 'Failed to fetch user posts';
      })
      .addCase(fetchUserReposts.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchUserReposts.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.userReposts[action.payload.userId] = action.payload.reposts;
      })
      .addCase(fetchUserReposts.rejected, (state, action) => {
        state.status = 'failed';
        state.error = (action.payload as string) || 'Failed to fetch user reposts';
      })
      .addCase(fetchSavedPosts.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchSavedPosts.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.savedPosts = action.payload;
      })
      .addCase(fetchSavedPosts.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message || 'Failed to fetch saved posts';
      })
      .addCase(fetchMyArchivedPosts.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchMyArchivedPosts.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.archivedPosts = action.payload;
      })
      .addCase(fetchMyArchivedPosts.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message || 'Failed to fetch archived posts';
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
          }
        }
      })
      .addCase(togglePostSave.fulfilled, (state, action) => {
        const postInFeed = state.feed.find(p => p.id === action.payload.postId);
        if (postInFeed) {
          postInFeed.isSaved = action.payload.saved;
          if (action.payload.saves !== undefined) {
            postInFeed.saves = action.payload.saves;
          }
        }
        if (action.payload.saved) {
          if (postInFeed && !state.savedPosts.find(p => p.id === action.payload.postId)) {
            state.savedPosts.push(postInFeed);
          }
        } else {
          state.savedPosts = state.savedPosts.filter(p => p.id !== action.payload.postId);
        }
      })
      .addCase(togglePostRepost.fulfilled, (state, action) => {
        const post = state.feed.find(p => p.id === action.payload.postId);
        if (post) {
          post.isReposted = action.payload.reposted;
          if (action.payload.shares !== undefined) {
            post.shares = action.payload.shares;
          }
        }
      })
      .addCase(archivePost.fulfilled, (state, action) => {
        const postId = action.payload;
        const post = state.feed.find(p => p.id === postId);
        if (post) {
          post.isArchived = true;
          state.archivedPosts.push(post);
        }
        state.feed = state.feed.filter(p => p.id !== postId);
        state.myPosts = state.myPosts.filter(p => p.id !== postId);
        state.myReposts = state.myReposts.filter(p => p.id !== postId);
        state.savedPosts = state.savedPosts.filter(p => p.id !== postId);
      })
      .addCase(unarchivePost.fulfilled, (state, action) => {
        const postId = action.payload;
        const post = state.archivedPosts.find(p => p.id === postId);
        if (post) {
          post.isArchived = false;
          state.feed.unshift(post);
        }
        state.archivedPosts = state.archivedPosts.filter(p => p.id !== postId);
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
        const deletedId = action.payload; // your thunk returns postId (string)

        state.myPosts = state.myPosts.filter((p) => p.id !== deletedId);
        state.myReposts = state.myReposts.filter((p) => p.id !== deletedId);
        state.feed = state.feed.filter((p) => p.id !== deletedId);
        state.savedPosts = state.savedPosts.filter((p) => p.id !== deletedId);
        state.archivedPosts = state.archivedPosts.filter((p) => p.id !== deletedId);

        if (state.postComments[deletedId]) {
          delete state.postComments[deletedId];
        }
      });
  },
});

export const {
  addPost,
  toggleLike,
  toggleSave,
  repostPost,
  toggleCommentsAllowed,
  toggleLikesVisible,
  removePostsByUserId, // Export the new action
} = postsSlice.actions;
export default postsSlice.reducer;
