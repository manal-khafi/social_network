/**
 * Example: Using the API in a React Component
 *
 * This demonstrates:
 * - Proper error handling
 * - Loading states
 * - Optimistic updates for likes
 * - Type-safe API calls
 */

import { useState, useEffect } from "react";
import { postsApi } from "../../api/postsApi";
import { toast } from "sonner"; // or your toast library

interface ApiError {
  message: string;
  code: string;
  status?: number;
  data?: unknown;
}

interface Post {
  id: string;
  content: string | null;
  media_urls: string[];
  user: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
  _count: {
    comments: number;
    likes: number;
    reposts: number;
    shares: number;
    saves: number;
  };
  isLiked?: boolean;
  isReposted?: boolean;
  created_at: string;
}

export const PostFeedExample: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [likingPostId, setLikingPostId] = useState<string | null>(null);
  const [repostingPostId, setRepostingPostId] = useState<string | null>(null);

  // Fetch posts on mount
  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await postsApi.getPosts();
      setPosts(response.data);
    } catch (err) {
      const apiError = err as ApiError;
      const errorMessage = apiError.message || "Failed to load posts";
      setError(errorMessage);

      // Error interceptor already handles 401/403, so this is for other errors
      if (apiError.code !== "UNAUTHORIZED") {
        toast.error(`Failed to load posts: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle like with optimistic update
  const handleLike = async (postId: string) => {
    // Optimistic update
    setPosts((prevPosts) =>
      prevPosts.map((post) => {
        if (post.id === postId) {
          const newIsLiked = !post.isLiked;
          return {
            ...post,
            isLiked: newIsLiked,
            _count: {
              ...post._count,
              likes: newIsLiked
                ? post._count.likes + 1
                : Math.max(0, post._count.likes - 1),
            },
          };
        }
        return post;
      })
    );

    try {
      setLikingPostId(postId);
      const response = await postsApi.toggleLike(postId);

      // Update with server response (more accurate)
      if (response.data) {
        setPosts((prevPosts) =>
          prevPosts.map((post) => {
            if (post.id === postId) {
              return {
                ...post,
                isLiked: response.data.isLiked,
                _count: {
                  ...post._count,
                  likes: response.data.likeCount,
                },
              };
            }
            return post;
          })
        );
      }
    } catch (err) {
      const apiError = err as ApiError;
      // Revert optimistic update on error
      setPosts((prevPosts) =>
        prevPosts.map((post) => {
          if (post.id === postId) {
            return {
              ...post,
              isLiked: !post.isLiked,
              _count: {
                ...post._count,
                likes: post.isLiked
                  ? post._count.likes - 1
                  : post._count.likes + 1,
              },
            };
          }
          return post;
        })
      );

      // Error interceptor handles 401/403, so only show other errors
      if (apiError.code !== "UNAUTHORIZED") {
        toast.error(
          `Failed to toggle like: ${apiError.message || "Unknown error"}`
        );
      }
    } finally {
      setLikingPostId(null);
    }
  };

  // Handle repost
  const handleRepost = async (postId: string, caption?: string) => {
    try {
      setRepostingPostId(postId);
      await postsApi.repostPost(postId, caption);

      toast.success("Post reposted!");

      // Update post repost status
      setPosts((prevPosts) =>
        prevPosts.map((post) => {
          if (post.id === postId) {
            return {
              ...post,
              isReposted: true,
              _count: {
                ...post._count,
                reposts: post._count.reposts + 1,
              },
            };
          }
          return post;
        })
      );
    } catch (err) {
      const apiError = err as ApiError;
      // Error interceptor handles 401/403
      if (apiError.code !== "UNAUTHORIZED") {
        toast.error(`Failed to repost: ${apiError.message || "Unknown error"}`);
      }
    } finally {
      setRepostingPostId(null);
    }
  };

  // Handle remove repost
  const handleRemoveRepost = async (postId: string) => {
    try {
      setRepostingPostId(postId);
      await postsApi.removeRepost(postId);

      toast.success("Repost removed");

      // Update post repost status
      setPosts((prevPosts) =>
        prevPosts.map((post) => {
          if (post.id === postId) {
            return {
              ...post,
              isReposted: false,
              _count: {
                ...post._count,
                reposts: Math.max(0, post._count.reposts - 1),
              },
            };
          }
          return post;
        })
      );
    } catch (err) {
      const apiError = err as ApiError;
      if (apiError.code !== "UNAUTHORIZED") {
        toast.error(
          `Failed to remove repost: ${apiError.message || "Unknown error"}`
        );
      }
    } finally {
      setRepostingPostId(null);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading posts...</div>;
  }

  if (error) {
    return (
      <div className="p-8">
        <p className="text-red-500 mb-4">Error: {error}</p>
        <button
          onClick={loadPosts}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Posts Feed</h1>

      {posts.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No posts yet</p>
      ) : (
        posts.map((post) => (
          <div key={post.id} className="bg-white rounded-lg shadow p-6 mb-4">
            {/* Post Header */}
            <div className="flex items-center mb-4">
              <img
                src={post.user.avatar_url || "/default-avatar.png"}
                alt={post.user.username}
                className="w-10 h-10 rounded-full mr-3"
              />
              <div>
                <h3 className="font-semibold">
                  {post.user.display_name || post.user.username}
                </h3>
                <p className="text-sm text-gray-500">@{post.user.username}</p>
              </div>
            </div>

            {/* Post Content */}
            <p className="mb-4">{post.content}</p>

            {/* Post Actions */}
            <div className="flex items-center gap-6 text-gray-600">
              <button
                onClick={() => handleLike(post.id)}
                disabled={likingPostId === post.id}
                className={`flex items-center gap-2 hover:text-red-500 ${
                  post.isLiked ? "text-red-500" : ""
                } ${
                  likingPostId === post.id
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
              >
                <span>❤️</span>
                <span>{post._count.likes}</span>
              </button>

              {post.isReposted ? (
                <button
                  onClick={() => handleRemoveRepost(post.id)}
                  disabled={repostingPostId === post.id}
                  className="flex items-center gap-2 hover:text-green-500 text-green-500 disabled:opacity-50"
                >
                  <span>🔄</span>
                  <span>{post._count.reposts}</span>
                </button>
              ) : (
                <button
                  onClick={() => handleRepost(post.id)}
                  disabled={repostingPostId === post.id}
                  className="flex items-center gap-2 hover:text-green-500 disabled:opacity-50"
                >
                  <span>🔄</span>
                  <span>{post._count.reposts}</span>
                </button>
              )}

              <span className="flex items-center gap-2">
                💬 {post._count.comments}
              </span>
            </div>
          </div>
        ))
      )}
    </div>
  );
};
