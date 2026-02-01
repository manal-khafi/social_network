import api from "./axios";

export interface AccountSettings {
  display_name: string; // Prisma: display_name
  username: string;
  bio?: string;
  email: string;
  avatar_url?: string; // Prisma: avatar_url
  gender?: string;
  date_of_birth?: string;
  account_name?: string;
  adresse?: string;
}

export interface PrivacySettings {
  is_private: boolean; // Prisma: is_private (NOT isPublic)
  showActivityStatus: boolean;
  allowStorySharing: boolean;
  whoCanSeeYourPosts: "everyone" | "followers" | "mentioned";
  whoCanSeeYourStories: "everyone" | "followers" | "close-friends";
  taggedPostsApproval: boolean;
  whoCanContact: "everyone" | "followers" | "none";
  commentFiltering: boolean;
  hideOffensiveWords: boolean;
}

export interface NotificationSettings {
  all: boolean;
  channels: {
    push: boolean;
    email: boolean;
    inApp: boolean;
  };
  likes: boolean;
  comments: boolean;
  follows: boolean;
  mentions: boolean;
  reposts: boolean;
  timing: "always" | "scheduled" | "important";
  messageRequests: boolean;
  groupMessages: boolean;
  videoCalls: boolean;
}

export interface AppearanceSettings {
  theme: "light" | "dark" | "system";
  fontSize: number;
  layoutDensity: "compact" | "comfortable" | "spacious";
  language: string;
  accessibility: {
    highContrast: boolean;
    reducedMotion: boolean;
    screenReader: boolean;
    largerTouchTargets: boolean;
  };
}

export interface AllSettings {
  account: AccountSettings;
  privacy: PrivacySettings;
  notifications: NotificationSettings;
  appearance: AppearanceSettings;
}

// Notifications
export interface NotificationUserSummary {
  id: string;
  display_name: string;
  avatar_url?: string | null;
}

export interface TypeNotificationSummary {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  template?: string | null;
}

export interface NotificationItem {
  id: string;
  source_id?: string | null;
  source_type?: string | null;
  title: string;
  message: string;
  is_read: boolean;
  metadata?: unknown;
  created_at: string;
  user: NotificationUserSummary;
  typeNotification: TypeNotificationSummary;
}

export interface NotificationsResponse {
  items: NotificationItem[];
  total: number;
  unread: number;
  page: number;
  totalPages: number;
}

// Account Settings
export const getAccount = async (): Promise<AccountSettings> => {
  const response = await api.get("/settings/account");
  return response.data;
};

export const updateAccount = async (
  data: Partial<AccountSettings>,
): Promise<AccountSettings> => {
  const response = await api.patch("/settings/account", data);
  return response.data;
};

export const changePassword = async (
  currentPassword: string,
  newPassword: string,
): Promise<void> => {
  await api.post("/settings/account/password", {
    currentPassword,
    newPassword,
  });
};

export const toggleActive = async (): Promise<void> => {
  await api.patch("/settings/account/toggle-active");
};

export const deleteAccount = async (
  password: string,
  reason: string,
): Promise<void> => {
  await api.delete("/settings/account", { data: { password, reason } });
};

// Privacy Settings
export const getPrivacySettings = async (): Promise<PrivacySettings> => {
  const response = await api.get("/settings/privacy");
  return response.data;
};

export const togglePrivateAccount = async (): Promise<void> => {
  await api.patch("/settings/privacy/toggle-private");
};

export const updatePrivacySettings = async (
  data: Partial<PrivacySettings>,
): Promise<PrivacySettings> => {
  const response = await api.patch("/settings/privacy", data);
  return response.data;
};

export const togglePrivate = async (): Promise<void> => {
  await api.patch("/settings/privacy/toggle-private");
};

// Notification Settings
export const getNotification = async (): Promise<NotificationsResponse> => {
  const response = await api.get("/settings/notifications");
  return response.data as NotificationsResponse;
};

export const getNotificationSettings =
  async (): Promise<NotificationSettings> => {
    const response = await api.get("/settings/notifications/settings");
    return response.data;
  };
export const updateNotificationSettings = async (
  data: Partial<NotificationSettings>,
): Promise<NotificationSettings> => {
  const response = await api.patch("/settings/notifications/settings", data);
  return response.data;
};

export const markAllNotificationsRead = async (): Promise<void> => {
  await api.patch("/settings/notifications/mark-read");
};

// Appearance Settings
export const getAppearanceSettings = async (): Promise<AppearanceSettings> => {
  const response = await api.get("/settings/appearance");
  return response.data;
};

export const updateAppearanceSettings = async (
  data: Partial<AppearanceSettings>,
): Promise<AppearanceSettings> => {
  const response = await api.patch("/settings/appearance", data);
  return response.data;
};

// All Settings
export const getAllSettings = async (): Promise<AllSettings> => {
  const response = await api.get("/");
  return response.data;
};
