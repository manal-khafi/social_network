import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { postsApi } from "../../api/postsApi";
import { toast } from "sonner";
import type { AppDispatch } from "../../store";

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
  loading: boolean;
  error: string | null;
}

const mockPosts: Post[] = [
  {
    id: "1",
    userId: "2",
    username: "jane_smith",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400",
    content:
      "Just captured this amazing sunset! 🌅 The colors were absolutely breathtaking.",
    images: [
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800",
    ],
    likes: 234,
    comments: 45,
    shares: 12,
    saves: 67,
    isLiked: false,
    isSaved: false,
    isReposted: false,
    isArchived: false,
    timestamp: "2h ago",
    commentsAllowed: true,
    likesVisible: true,
  },
  {
    id: "2",
    userId: "3",
    username: "mike_wilson",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
    content:
      "Morning workout done! 💪 Remember, consistency is key. #fitness #motivation",
    likes: 456,
    comments: 23,
    shares: 8,
    saves: 34,
    isLiked: false,
    isSaved: false,
    isReposted: false,
    isArchived: false,
    timestamp: "4h ago",
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
    "1": [
      {
        id: "c1",
        postId: "1",
        userId: "3",
        username: "mike_wilson",
        avatar:
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
        content: "Absolutely stunning! 😍",
        likes: 5,
        isLiked: false,
        timestamp: "1h ago",
        replies: [
          {
            id: "r1",
            postId: "1",
            userId: "2",
            username: "jane_smith",
            avatar:
              "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400",
            content: "Thank you! 🙏",
            likes: 2,
            isLiked: false,
            timestamp: "45m ago",
            replies: [],
          },
        ],
      },
      {
        id: "c2",
        postId: "1",
        userId: "1",
        username: "john_doe",
        avatar:
          "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400",
        content: "Great shot! What camera did you use?",
        likes: 1,
        isLiked: true,
        timestamp: "30m ago",
        replies: [],
      },
    ],
    "2": [
      {
        id: "c3",
        postId: "2",
        userId: "2",
        username: "jane_smith",
        avatar:
          "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400",
        content: "So inspiring! 💪",
        likes: 8,
        isLiked: false,
        timestamp: "3h ago",
        replies: [],
      },
    ],
  },
  loading: false,
  error: null,
};

// ============ ASYNC THUNKS ============

export const fetchPosts = createAsyncThunk(
  "posts/fetchPosts",
  async (_, { rejectWithValue }) => {
    try {
      const response = await postsApi.getPosts();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch posts"
      );
    }
  }
);

export const createPostAsync = createAsyncThunk(
  "posts/createPost",
  async (
    { content, media_urls }: { content: string; media_urls?: string[] },
    { rejectWithValue }
  ) => {
    try {
      const response = await postsApi.createPost(content, media_urls);
      toast.success("Post created successfully!");
      return response.data;
    } catch (error: any) {
      toast.error("Failed to create post");
      return rejectWithValue(
        error.response?.data?.message || "Failed to create post"
      );
    }
  }
);

export const likePostAsync = createAsyncThunk(
  "posts/likePost",
  async (postId: string, { rejectWithValue, getState }) => {
    try {
      // Use toggleLike which handles both like and unlike
      const response = await postsApi.toggleLike(postId);
      return {
        postId,
        isLiked: response.data.isLiked,
        likeCount: response.data.likeCount,
      };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to toggle like"
      );
    }
  }
);

export const savePostAsync = createAsyncThunk(
  "posts/savePost",
  async (postId: string, { rejectWithValue }) => {
    try {
      await postsApi.savePost(postId);
      return postId;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to save post"
      );
    }
  }
);

export const repostPostAsync = createAsyncThunk(
  "posts/repostPost",
  async (
    { postId, caption }: { postId: string; caption?: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await postsApi.repostPost(postId, caption);
      toast.success("Post reposted!");
      return { postId, repost: response.data };
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || error.message || "Failed to repost";
      toast.error(errorMessage);
      return rejectWithValue(errorMessage);
    }
  }
);

export const removeRepostAsync = createAsyncThunk(
  "posts/removeRepost",
  async (postId: string, { rejectWithValue }) => {
    try {
      await postsApi.removeRepost(postId);
      toast.success("Repost removed");
      return postId;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Failed to remove repost";
      toast.error(errorMessage);
      return rejectWithValue(errorMessage);
    }
  }
);

export const deletePostAsync = createAsyncThunk(
  "posts/deletePost",
  async (postId: string, { rejectWithValue }) => {
    try {
      await postsApi.deletePost(postId);
      toast.success("Post deleted");
      return postId;
    } catch (error: any) {
      toast.error("Failed to delete post");
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete post"
      );
    }
  }
);

export const addCommentAsync = createAsyncThunk(
  "posts/addComment",
  async (
    { postId, content }: { postId: string; content: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await postsApi.addComment(postId, content);
      return { postId, comment: response.data };
    } catch (error: any) {
      toast.error("Failed to add comment");
      return rejectWithValue(
        error.response?.data?.message || "Failed to add comment"
      );
    }
  }
);

export const likeCommentAsync = createAsyncThunk(
  "posts/likeComment",
  async (
    { postId, commentId }: { postId: string; commentId: string },
    { rejectWithValue }
  ) => {
    try {
      await postsApi.likeComment(postId, commentId);
      return { postId, commentId };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to like comment"
      );
    }
  }
);

export const addReplyAsync = createAsyncThunk(
  "posts/addReply",
  async (
    {
      postId,
      commentId,
      content,
    }: { postId: string; commentId: string; content: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await postsApi.addReply(postId, commentId, content);
      return { postId, commentId, reply: response.data };
    } catch (error: any) {
      toast.error("Failed to add reply");
      return rejectWithValue(
        error.response?.data?.message || "Failed to add reply"
      );
    }
  }
);

// ============ SLICE ============

const postsSlice = createSlice({
  name: "posts",
  initialState,
  reducers: {
    // Synchronous actions for UI-only updates
    toggleCommentsAllowed: (state, action: PayloadAction<string>) => {
      const post = state.feed.find((p) => p.id === action.payload);
      if (post && post.userId === "1") {
        post.commentsAllowed = !post.commentsAllowed;
      }
    },
    toggleLikesVisible: (state, action: PayloadAction<string>) => {
      const post = state.feed.find((p) => p.id === action.payload);
      if (post && post.userId === "1") {
        post.likesVisible = !post.likesVisible;
      }
    },
    unarchivePost: (state, action: PayloadAction<string>) => {
      const post = state.archivedPosts.find((p) => p.id === action.payload);
      if (post) {
        post.isArchived = false;
        state.feed.unshift(post);
        state.archivedPosts = state.archivedPosts.filter(
          (p) => p.id !== action.payload
        );
      }
    },
  },
  extraReducers: (builder) => {
    // Fetch Posts
    builder
      .addCase(fetchPosts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPosts.fulfilled, (state, action) => {
        state.loading = false;
        state.feed = action.payload;
      })
      .addCase(fetchPosts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Create Post
    builder
      .addCase(createPostAsync.pending, (state) => {
        state.loading = true;
      })
      .addCase(createPostAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.feed.unshift(action.payload);
      })
      .addCase(createPostAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Like Post (Toggle)
    builder
      .addCase(likePostAsync.fulfilled, (state, action) => {
        const post = state.feed.find((p) => p.id === action.payload.postId);
        if (post) {
          post.isLiked = action.payload.isLiked;
          post.likes = action.payload.likeCount;
        }
        // Also update in savedPosts and archivedPosts if present
        const savedPost = state.savedPosts.find(
          (p) => p.id === action.payload.postId
        );
        if (savedPost) {
          savedPost.isLiked = action.payload.isLiked;
          savedPost.likes = action.payload.likeCount;
        }
        const archivedPost = state.archivedPosts.find(
          (p) => p.id === action.payload.postId
        );
        if (archivedPost) {
          archivedPost.isLiked = action.payload.isLiked;
          archivedPost.likes = action.payload.likeCount;
        }
      })
      .addCase(likePostAsync.rejected, (state, action) => {
        toast.error((action.payload as string) || "Failed to toggle like");
      });

    // Save Post
    builder
      .addCase(savePostAsync.fulfilled, (state, action) => {
        const post = state.feed.find((p) => p.id === action.payload);
        if (post) {
          post.isSaved = !post.isSaved;
          post.saves += post.isSaved ? 1 : -1;
          if (post.isSaved) {
            state.savedPosts.push(post);
          } else {
            state.savedPosts = state.savedPosts.filter((p) => p.id !== post.id);
          }
        }
      })
      .addCase(savePostAsync.rejected, () => {
        toast.error("Failed to save post");
      });

    // Repost
    builder
      .addCase(repostPostAsync.fulfilled, (state, action) => {
        const originalPost = state.feed.find(
          (p) => p.id === action.payload.postId
        );
        if (originalPost) {
          originalPost.isReposted = true;
          // Increment shares count if available from response
          if (action.payload.repost?.originalPost?._count?.reposts) {
            originalPost.shares =
              action.payload.repost.originalPost._count.reposts;
          } else {
            originalPost.shares += 1;
          }
        }
      })
      .addCase(repostPostAsync.rejected, (state, action) => {
        // Error toast already shown in thunk
      })
      .addCase(removeRepostAsync.fulfilled, (state, action) => {
        const originalPost = state.feed.find((p) => p.id === action.payload);
        if (originalPost) {
          originalPost.isReposted = false;
          originalPost.shares = Math.max(0, originalPost.shares - 1);
        }
      })
      .addCase(removeRepostAsync.rejected, (state, action) => {
        // Error toast already shown in thunk
      });

    // Delete Post
    builder
      .addCase(deletePostAsync.fulfilled, (state, action) => {
        state.feed = state.feed.filter((p) => p.id !== action.payload);
        state.archivedPosts = state.archivedPosts.filter(
          (p) => p.id !== action.payload
        );
      })
      .addCase(deletePostAsync.rejected, () => {
        toast.error("Failed to delete post");
      });

    // Add Comment
    builder
      .addCase(addCommentAsync.fulfilled, (state, action) => {
        const { postId, comment } = action.payload;
        if (!state.postComments[postId]) {
          state.postComments[postId] = [];
        }
        state.postComments[postId].push(comment);
        const post = state.feed.find((p) => p.id === postId);
        if (post) post.comments += 1;
      })
      .addCase(addCommentAsync.rejected, () => {
        toast.error("Failed to add comment");
      });

    // Like Comment
    builder.addCase(likeCommentAsync.fulfilled, (state, action) => {
      const { postId, commentId } = action.payload;
      const comments = state.postComments[postId];
      if (comments) {
        const comment = comments.find((c) => c.id === commentId);
        if (comment) {
          comment.isLiked = !comment.isLiked;
          comment.likes += comment.isLiked ? 1 : -1;
        }
      }
    });

    // Add Reply
    builder
      .addCase(addReplyAsync.fulfilled, (state, action) => {
        const { postId, commentId, reply } = action.payload;
        const comments = state.postComments[postId];
        if (comments) {
          const parentComment = comments.find((c) => c.id === commentId);
          if (parentComment) {
            if (!parentComment.replies) {
              parentComment.replies = [];
            }
            parentComment.replies.push(reply);
            const post = state.feed.find((p) => p.id === postId);
            if (post) post.comments += 1;
          }
        }
      })
      .addCase(addReplyAsync.rejected, () => {
        toast.error("Failed to add reply");
      });
  },
});

export const { toggleCommentsAllowed, toggleLikesVisible, unarchivePost } =
  postsSlice.actions;

// ============ ACTION WRAPPERS FOR BACKWARD COMPATIBILITY ============
// These wrap async thunks to maintain compatibility with existing code

export const toggleLike = (postId: string) => (dispatch: AppDispatch) => {
  dispatch(likePostAsync(postId));
};

export const toggleSave = (postId: string) => (dispatch: AppDispatch) => {
  dispatch(savePostAsync(postId));
};

export const repostPost =
  (postId: string, caption?: string) => (dispatch: AppDispatch) => {
    dispatch(repostPostAsync({ postId, caption }));
  };

export const addComment =
  (payload: { postId: string; content: string }) => (dispatch: AppDispatch) => {
    dispatch(addCommentAsync(payload));
  };

export const toggleCommentLike =
  (payload: { postId: string; commentId: string }) =>
  (dispatch: AppDispatch) => {
    dispatch(likeCommentAsync(payload));
  };

export const addReply =
  (payload: { postId: string; commentId: string; content: string }) =>
  (dispatch: AppDispatch) => {
    dispatch(addReplyAsync(payload));
  };

export const toggleReplyLike =
  (_payload: { postId: string; commentId: string; replyId: string }) =>
  (_dispatch: AppDispatch) => {
    // This would need a separate API endpoint if you want to make it async
    // For now, keeping the synchronous version
  };

export const archivePost = (postId: string) => (dispatch: AppDispatch) => {
  dispatch(deletePostAsync(postId));
};

export const addPost = (postData: any) => (dispatch: AppDispatch) => {
  dispatch(createPostAsync(postData));
};

export default postsSlice.reducer;
