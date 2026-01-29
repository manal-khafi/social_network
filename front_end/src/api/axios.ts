import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3500/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  console.log("Token from localStorage:", token ? "Found" : "Not found");
  if (token) {
    console.log("Token length:", token.length);
    console.log("Token starts with:", token.substring(0, 50));
    config.headers.Authorization = `Bearer ${token}`;
    console.log("Authorization header set:", config.headers.Authorization.substring(0, 60));
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

api.interceptors.response.use((response) => {
  // Check if server sent a new token in response headers
  const newToken = response.headers["x-access-token"];
  if (newToken) {
    console.log("New token from server, saving:", newToken.substring(0, 50));
    localStorage.setItem("token", newToken);
  }
  return response;
}, (error) => {
  return Promise.reject(error);
});

export const getCommunities = () => api.get('/communities/');

export const getCommunityById = (id: string | number) => api.get(`/communities/${id}`);

export const getCommunityMembers = (communityId: string | number) => api.get(`/communities/${communityId}/members`);

export const checkMembershipStatus = (communityId: string | number, userId: string | number) => 
  api.get(`/communities/${communityId}/members/${userId}/status`);

export const joinCommunity = (communityId: string | number, userId: string | number, message?: string) => 
  api.post(`/communities/${communityId}/request/${userId}`, { message });

export const leaveCommunity = (communityId: string | number, userId: string | number) => 
  api.delete(`/communities/${communityId}/members/${userId}`);

export const createCommunity = async (data: { name: string; bio: string; type?: string; image?: string; avatar?: string }) => {
  return api.post('/communities/', {
    name: data.name,
    bio: data.bio,
    type: data.type || 'other',
    image: data.image || null,
    avatar: data.avatar || null,
  });
};

export const updateCommunity = async (id: string | number, data: { name?: string; bio?: string; description?: string; banner_url?: string; avatar_url?: string; is_private?: boolean; allow_posts?: boolean; require_approval?: boolean; type?: string }) => {
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

export const getCommunityRequests = (communityId: string | number) => api.get(`/communities/${communityId}/requests`);

export const createJoinRequest = (communityId: string | number, userId: string | number, message?: string) => 
  api.post(`/communities/${communityId}/request/${userId}`, { message, status: 'pending' });

export const approveJoinRequest = (communityId: string | number, requestId: string | number, userId: string | number) => 
  api.patch(`/communities/${communityId}/requests/${requestId}/${userId}`, { status: 'approved' });

export const rejectJoinRequest = (communityId: string | number, requestId: string | number, userId: string | number) => 
  api.patch(`/communities/${communityId}/requests/${requestId}/${userId}`, { status: 'rejected' });

// Community Rules APIs
export const getCommunityRules = (communityId: string | number) => api.get(`/communities/${communityId}/rules`);

export const createCommunityRule = (communityId: string | number, data: { title: string; description: string; order?: number }) => 
  api.post(`/communities/${communityId}/rules`, data);

export const updateCommunityRule = (communityId: string | number, ruleId: string | number, data: { title?: string; description?: string; order?: number }) => 
  api.put(`/communities/${communityId}/rules/${ruleId}`, data);

export const deleteCommunityRule = (communityId: string | number, ruleId: string | number) => 
  api.delete(`/communities/${communityId}/rules/${ruleId}`);

export default api;
