import axios, { AxiosError } from "axios";

/**
 * API Configuration
 * Supports both local development and Docker environments
 */
const getApiBaseUrl = (): string => {
  // Check environment variable first
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  // Default based on environment
  // Local development: backend runs on port 3500
  // Docker: backend service accessible via service name or relative URL
  if (import.meta.env.DEV) {
    return "http://localhost:3500/api";
  }

  // Production/Docker - use relative URL if behind reverse proxy
  // Or use service name in Docker: http://backend:3500/api
  return "/api";
};

const api = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 30000, // 30 seconds
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

/**
 * Token Management
 * Handles both "authToken" and "token" for backward compatibility
 */
const getAuthToken = (): string | null => {
  return localStorage.getItem("authToken") || localStorage.getItem("token");
};

/**
 * Request Interceptor - Attach JWT Token
 */
api.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor - Handle Errors Globally
 */
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError) => {
    // Handle network errors
    if (!error.response) {
      console.error("Network error:", error.message);
      return Promise.reject({
        message: "Network error. Please check your connection.",
        code: "NETWORK_ERROR",
      });
    }

    const { status, data } = error.response;

    // Handle authentication errors (401/403)
    if (status === 401 || status === 403) {
      // Clear tokens
      localStorage.removeItem("authToken");
      localStorage.removeItem("token");

      // Redirect to login if not already on auth page
      const currentPath = window.location.pathname;
      const authPaths = ["/login", "/register", "/auth"];
      const isAuthPage = authPaths.some((path) => currentPath.startsWith(path));

      if (!isAuthPage) {
        // Store intended destination
        sessionStorage.setItem("redirectAfterLogin", currentPath);
        window.location.href = "/login";
      }

      const errorMessage =
        data && typeof data === "object" && "message" in data
          ? (data as { message: string }).message
          : "Authentication required";

      return Promise.reject({
        message: errorMessage,
        code: "UNAUTHORIZED",
        status,
      });
    }

    // Handle other HTTP errors
    const errorMessage =
      data && typeof data === "object" && "message" in data
        ? (data as { message: string }).message
        : `Request failed with status ${status}`;

    return Promise.reject({
      message: errorMessage,
      code: `HTTP_${status}`,
      status,
      data,
    });
  }
);

export const postsApi = {
  // Get all public posts
  getPosts: () => api.get("/posts"),

  // Create a new post
  createPost: (content: string, media_urls?: string[], visibility?: string) =>
    api.post("/posts", { content, media_urls, visibility }),

  // Update a post
  updatePost: (
    postId: string,
    content: string,
    media_urls?: string[],
    visibility?: string
  ) => api.put(`/posts/${postId}`, { content, media_urls, visibility }),

  // Delete a post
  deletePost: (postId: string) => api.delete(`/posts/${postId}`),

  // Toggle like on a post (single endpoint handles both like and unlike)
  toggleLike: (postId: string) => api.post(`/posts/${postId}/like`),

  // Legacy: Like a post (for backward compatibility)
  likePost: (postId: string) => api.post(`/posts/${postId}/like`),

  // Legacy: Unlike a post (for backward compatibility)
  unlikePost: (postId: string) => api.delete(`/posts/${postId}/like`),

  // Save a post
  savePost: (postId: string) => api.post(`/posts/${postId}/save`),

  // Unsave a post
  unsavePost: (postId: string) => api.delete(`/posts/${postId}/save`),

  // Repost - FIXED: Backend route is /api/reposts/:postId
  repostPost: (postId: string, caption?: string) =>
    api.post(`/reposts/${postId}`, caption ? { caption } : {}),

  // Remove repost - FIXED: Backend route is /api/reposts/:postId
  removeRepost: (postId: string) => api.delete(`/reposts/${postId}`),

  // Add comment
  addComment: (postId: string, content: string) =>
    api.post(`/posts/${postId}/comments`, { content }),

  // Like comment
  likeComment: (postId: string, commentId: string) =>
    api.post(`/posts/${postId}/comments/${commentId}/like`),

  // Add reply
  addReply: (postId: string, commentId: string, content: string) =>
    api.post(`/posts/${postId}/comments/${commentId}/replies`, { content }),
};

export default api;
