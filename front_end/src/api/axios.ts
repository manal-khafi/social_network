import axios from "axios";
import { store } from "../store";
import { logout, setAuth } from "../features/auth/authSlice";

const AUTH_STORAGE_KEY = "auth_session";

const readPersistedAuth = (): { token: string | null } => {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return { token: null };
    const parsed = JSON.parse(raw) as { token?: string };
    return { token: parsed.token ?? null };
  } catch {
    return { token: null };
  }
};

const rawBaseURL = import.meta.env.VITE_API_URL || "http://localhost:3500";
const baseURL = rawBaseURL.endsWith("/api") ? rawBaseURL : `${rawBaseURL}/api`;

const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use(
  (config) => {
    const url = config.url ?? "";

    // Don't attach token for social login (if your backend expects it public)
    if (url.includes("/authentication/social-login")) {
      return config;
    }

    let token = store.getState().auth.token;

    // If Redux lost token (refresh), try localStorage auth_session
    if (!token) {
      const persisted = readPersistedAuth();
      if (persisted.token) {
        token = persisted.token;
        const currentUser = store.getState().auth.user;
        store.dispatch(setAuth({ token: persisted.token, user: currentUser ?? null }));
      }
    }

    if (token) {
      config.headers = config.headers ?? {};
      (config.headers as any).Authorization = `Bearer ${token}`;
      // console.log("DEBUG: Axios sending BACKEND JWT length:", token.length);
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => {
    // If backend rotates token, capture it
    const newToken = response.headers?.["x-access-token"];
    if (newToken) {
      const currentUser = store.getState().auth.user;
      store.dispatch(setAuth({ token: newToken, user: currentUser ?? null }));
    }
    return response;
  },
  async (error) => {
    const status = error.response?.status;
    const url = error.config?.url ?? "";

    // Avoid infinite loop: don't logout when /authentication/me fails during boot
    if (status === 401 && !url.includes("/authentication/me")) {
      store.dispatch(logout());
    }

    return Promise.reject(error);
  }
);

// Community APIs
export const getCommunities = () => api.get("/communities/");
export const getCommunityById = (id: string | number) => api.get(`/communities/${id}`);
export const getCommunityMembers = (communityId: string | number) =>
  api.get(`/communities/${communityId}/members`);
export const checkMembershipStatus = (communityId: string | number, userId: string | number) =>
  api.get(`/communities/${communityId}/members/${userId}/status`);
export const joinCommunity = (communityId: string | number, userId: string | number, message?: string) =>
  api.post(`/communities/${communityId}/request/${userId}`, { message });
export const leaveCommunity = (communityId: string | number, userId: string | number) =>
  api.delete(`/communities/${communityId}/members/${userId}`);

export const createCommunity = (data: {
  name: string;
  bio: string;
  type?: string;
  image?: string;
  avatar?: string;
}) => {
  return api.post("/communities/", {
    name: data.name,
    bio: data.bio,
    type: data.type || "other",
    image: data.image || null,
    avatar: data.avatar || null,
  });
};

export const updateCommunity = (
  id: string | number,
  data: {
    name?: string;
    bio?: string;
    description?: string;
    banner_url?: string;
    avatar_url?: string;
    is_private?: boolean;
    allow_posts?: boolean;
    require_approval?: boolean;
    type?: string;
  }
) => {
  return api.put(`/communities/${id}`, {
    name: data.name,
    bio: data.bio || data.description,
    banner_url: data.banner_url,
    avatar_url: data.avatar_url,
    is_private: data.is_private,
    allow_posts: data.allow_posts,
    require_approval: data.require_approval,
    type: data.type,
  });
};

export const getCommunityRequests = (communityId: string | number) =>
  api.get(`/communities/${communityId}/requests`);

export const createJoinRequest = (communityId: string | number, userId: string | number, message?: string) =>
  api.post(`/communities/${communityId}/request/${userId}`, { message, status: "pending" });

export const approveJoinRequest = (communityId: string | number, requestId: string | number, userId: string | number) =>
  api.patch(`/communities/${communityId}/requests/${requestId}/${userId}`, { status: "approved" });

export const rejectJoinRequest = (communityId: string | number, requestId: string | number, userId: string | number) =>
  api.patch(`/communities/${communityId}/requests/${requestId}/${userId}`, { status: "rejected" });

// Community Rules APIs
export const getCommunityRules = (communityId: string | number) =>
  api.get(`/communities/${communityId}/rules`);

export const createCommunityRule = (
  communityId: string | number,
  data: { title: string; description: string; order?: number }
) => api.post(`/communities/${communityId}/rules`, data);

export const updateCommunityRule = (
  communityId: string | number,
  ruleId: string | number,
  data: { title?: string; description?: string; order?: number }
) => api.put(`/communities/${communityId}/rules/${ruleId}`, data);

export const deleteCommunityRule = (communityId: string | number, ruleId: string | number) =>
  api.delete(`/communities/${communityId}/rules/${ruleId}`);

export default api;
