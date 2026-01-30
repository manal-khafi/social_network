import api from "./axios";

export interface StoryUser {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
}

export interface Story {
    id: string;
    content_url: string;
    content_type: 'image' | 'video' | 'text' | 'link';
    visibility: 'public' | 'friends' | 'close_friends';
    duration_hours: number;
    expires_at: string;
    created_at: string;
    user_id: string;
    user: StoryUser;
    has_viewed: boolean;
    has_liked: boolean;
    _count: {
        views: number;
        likes: number;
        comments: number;
    };
}

// Get all stories
export const getStories = async (): Promise<Story[]> => {
    const response = await api.get("/stories");
    return response.data.data;
};

// Create a new story
export const createStory = async (data: {
    content_url: string;
    content_type: 'image' | 'video' | 'text' | 'link';
    visibility?: 'public' | 'friends' | 'close_friends';
    duration_hours?: number;
}): Promise<Story> => {
    const response = await api.post("/stories", data);
    return response.data.data;
};

// Get a specific story
export const getStory = async (id: string): Promise<Story> => {
    const response = await api.get(`/stories/${id}`);
    return response.data.data;
};

// View a story
export const viewStory = async (id: string): Promise<void> => {
    await api.post(`/stories/${id}/view`);
};

// Like a story
export const likeStory = async (id: string): Promise<void> => {
    await api.post(`/stories/${id}/like`);
};

// Unlike a story
export const unlikeStory = async (id: string): Promise<void> => {
    await api.delete(`/stories/${id}/like`);
};

// Delete a story
export const deleteStory = async (id: string): Promise<void> => {
    await api.delete(`/stories/${id}`);
};
