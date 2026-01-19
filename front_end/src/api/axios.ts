import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3500/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

export const getCommunities = () => api.get('/communities/');

export const getCommunityById = (id: string | number) => api.get(`/communities/${id}`);

export const getCommunityMembers = (communityId: string | number) => api.get(`/communities/${communityId}/members`);

export const createCommunity = async (data: { name: string; bio: string; type?: string; image?: string; avatar?: string }) => {
  return api.post('/communities/', {
    name: data.name,
    bio: data.bio,
    type: data.type || 'other',
    image: data.image || null,
    avatar: data.avatar || null,
  });
};

export const updateCommunity = async (id: string | number, data: { name?: string; bio?: string; description?: string; banner_url?: string; avatar_url?: string; is_private?: boolean; allow_posts?: boolean; require_approval?: boolean }) => {
  return api.put(`/communities/${id}`, {
    name: data.name,
    bio: data.bio || data.description,
    banner_url: data.banner_url,
    avatar_url: data.avatar_url,
    is_private: data.is_private,
    allow_posts: data.allow_posts,
    require_approval: data.require_approval,
  });
};

export default api;
