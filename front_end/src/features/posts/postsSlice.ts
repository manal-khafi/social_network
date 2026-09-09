import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import api from '../../api/axios';
import type { RootState } from '../../store';

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
  visibility?: 'public' | 'private' | 'friends';
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
  postComments: { [postId: string]: { comments: Comment[]; postOwnerId: string } };
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

// Helper function to update a post in all relevant lists
const updatePostInAllLists = (state: PostsState, postId: string, updates: Partial<Post>) => {
  const listsToUpdate: (Post[] | undefined)[] = [
    state.feed,
    state.myPosts,
    state.savedPosts,
    state.myReposts,
    state.archivedPosts,
  ];

  for (const list of listsToUpdate) {
    if (list) {
      const post = list.find((p) => p.id === postId);
      if (post) {
        Object.assign(post, updates);
      }
    }
  }

  for (const userId in state.userPosts) {
    const userPostList = state.userPosts[userId];
    if (userPostList) {
      const post = userPostList.find((p) => p.id === postId);
      if (post) {
        Object.assign(post, updates);
      }
    }
  }
};
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
    const response = await api.get(`/comments/get-comments/${postId}`);
    return {
      postId,
      comments: response.data.comments as Comment[],
      postOwnerId: response.data.postOwnerId as string
    };
  }
);

export const createComment = createAsyncThunk(
  'posts/createComment',
  async (payload: { postId: string; content: string; parent_comment_id?: string | null }) => {
    const response = await api.post(`/comments/create-comment`, {
      postId: payload.postId,
      content: payload.content,
      parent_comment_id: payload.parent_comment_id ?? null,
    });
    return { postId: payload.postId, comment: response.data.comment as Comment };
  }
);

export const updateComment = createAsyncThunk(
  'posts/updateComment',
  async (payload: { postId: string; commentId: string; content: string }) => {
    const response = await api.put(`/comments/modify-comment/${payload.commentId}`, { content: payload.content });
    return { postId: payload.postId, commentId: payload.commentId, updatedComment: response.data.comment };
  }
);

export const deleteComment = createAsyncThunk(
  "posts/deleteComment",
  async (payload: { postId: string; commentId: string }, { rejectWithValue }) => {
    try {
      const response = await api.delete(`/comments/delete-comment/${payload.commentId}`);
      return { ...payload, deletedCount: response.data.deletedCount };
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message ?? "Failed to delete comment");
    }
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
        const newPost = action.payload;
        const authorId = action.meta.arg.authorId;
        
        state.feed.unshift(newPost);
        state.myPosts.unshift(newPost);
        if (state.userPosts[authorId]) {
          state.userPosts[authorId].unshift(newPost);
        } else {
          state.userPosts[authorId] = [newPost];
        }
      })
      .addCase(createPost.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to create post';
      })
      .addCase(togglePostLike.fulfilled, (state, action) => {
        const { postId, liked, likes } = action.payload;
        updatePostInAllLists(state, postId, { isLiked: liked, likes });
      })
      .addCase(togglePostSave.fulfilled, (state, action) => {
        const { postId, saved, saves } = action.payload;
        updatePostInAllLists(state, postId, { isSaved: saved, saves });

        if (saved) {
          const post = state.feed.find(p => p.id === postId) ?? state.myPosts.find(p => p.id === postId);
          if (post && !state.savedPosts.some(p => p.id === postId)) {
            state.savedPosts.unshift(post);
          }
        } else {
          state.savedPosts = state.savedPosts.filter(p => p.id !== postId);
        }
      })
      .addCase(togglePostRepost.fulfilled, (state, action) => {
        const { postId, reposted, shares } = action.payload;
        updatePostInAllLists(state, postId, { isReposted: reposted, shares });
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
        state.postComments[action.payload.postId] = {
          comments: action.payload.comments,
          postOwnerId: action.payload.postOwnerId,
        };
      })
      .addCase(createComment.fulfilled, (state, action) => {
        const { postId, comment } = action.payload;
        if (!state.postComments[postId]) {
          state.postComments[postId] = { comments: [], postOwnerId: '' }; // This should ideally be set by fetchComments
        }
        if (comment.parent_comment_id) {
          const stack = [...state.postComments[postId].comments];
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
          state.postComments[postId].comments.push(comment);
        }
        const post = state.feed.find(p => p.id === postId);
        if (post) post.comments += 1;
      })
      .addCase(updateComment.fulfilled, (state, action) => {
        const { postId, commentId, updatedComment } = action.payload;
        const postComments = state.postComments[postId];
        if (!postComments) return;

        const findAndUpdate = (comments: Comment[]): boolean => {
          for (let i = 0; i < comments.length; i++) {
            if (comments[i].id === commentId) {
              comments[i].content = updatedComment.content;
              comments[i].timestamp = updatedComment.updatedAt;
              return true;
            }
            if (comments[i].replies && findAndUpdate(comments[i].replies!)) {
              return true;
            }
          }
          return false;
        };
        findAndUpdate(postComments.comments);
      })
      .addCase(deleteComment.fulfilled, (state, action) => {
        const { postId, commentId, deletedCount } = action.payload;
        const bucket = state.postComments[postId];
        if (bucket) {
          const removeRecursive = (comments: Comment[], idToRemove: string): Comment[] => {
            return comments
              .filter(c => c.id !== idToRemove)
              .map(c => {
                if (c.replies) {
                  return { ...c, replies: removeRecursive(c.replies, idToRemove) };
                }
                return c;
              });
          };
          bucket.comments = removeRecursive(bucket.comments, commentId);
        }

        const dec = Math.max(0, deletedCount);

        const decInList = (list: Post[]) => {
          const p = list.find((x) => x.id === postId);
          if (p) p.comments = Math.max(0, (p.comments ?? 0) - dec);
        };

        decInList(state.feed);
        decInList(state.myPosts);
        decInList(state.myReposts);
        decInList(state.savedPosts);
        decInList(state.archivedPosts);

        for (const uid of Object.keys(state.userPosts)) {
          decInList(state.userPosts[uid]);
        }
      })
      .addCase(toggleCommentLike.fulfilled, (state, action) => {
        const comments = state.postComments[action.payload.postId]?.comments;
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
        const deletedId = action.payload; 

        state.myPosts = state.myPosts.filter((p) => p.id !== deletedId);
        state.myReposts = state.myReposts.filter((p) => p.id !== deletedId);
        state.feed = state.feed.filter((p) => p.id !== deletedId);
        state.savedPosts = state.savedPosts.filter((p) => p.id !== deletedId);
        state.archivedPosts = state.archivedPosts.filter((p) => p.id !== deletedId);

        for (const userId in state.userPosts) {
          state.userPosts[userId] = state.userPosts[userId].filter(p => p.id !== deletedId);
        }

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
  removePostsByUserId,
} = postsSlice.actions;

const selectUserPosts = (state: RootState) => state.posts.userPosts;

export const selectPostsCountByUserId = createSelector(
  [selectUserPosts, (_, userId: string) => userId],
  (userPosts, userId) => (userPosts[userId] || []).length
);

export default postsSlice.reducer;
