import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

/* HELPERS */
// Strongly-typed helper to fetch a user with optional select
const getUserOrFail = async (userId: string, select?: any): Promise<any> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    // cast is safe because we control the generic T
    select: select as any,
  });

  if (!user) throw new Error("User not found");
  return user as any;
};

const getOrCreateUserSettings = async (userId: string): Promise<any> => {
  let settings = await prisma.userSettings.findUnique({
    where: { user_id: userId },
  });

  if (!settings) {
    settings = await prisma.userSettings.create({
      data: { user_id: userId },
    });
  }

  return settings;
};

/* ACCOUNT */
export const getAccount = async (userId: string) => {
  return getUserOrFail(userId, {
    id: true,
    username: true,
    email: true,
    display_name: true,
    bio: true,
    avatar_url: true,
    account_name: true,
    gender: true,
    date_of_birth: true,
    adresse: true,
    is_verified: true,
    is_private: true,
    is_active: true,
    provider: true,
    created_at: true,
    last_login: true,
  });
};

export const updateAccount = async (userId: string, data: any) => {
  const allowedFields = [
    "display_name",
    "username",
    "bio",
    "avatar_url",
    "account_name",
    "gender",
    "date_of_birth",
    "adresse",
  ];

  const updateData = Object.fromEntries(
    Object.entries(data).filter(([key]) => allowedFields.includes(key)),
  );

  return prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: {
      id: true,
      username: true,
      email: true,
      display_name: true,
      bio: true,
      avatar_url: true,
      account_name: true,
      gender: true,
      date_of_birth: true,
      adresse: true,
    },
  });
};

export const changePassword = async (
  userId: string,
  currentPassword: string,
  newPassword: string,
) => {
  const user = await getUserOrFail(userId, {
    provider: true,
    password_hash: true,
  });

  if (user.provider !== "local")
    throw new Error("OAuth account – password change disabled");

  if (!user.password_hash) throw new Error("No password set");

  const valid = await bcrypt.compare(currentPassword, user.password_hash);
  if (!valid) throw new Error("Incorrect password");

  if (newPassword.length < 8)
    throw new Error("Password must be at least 8 characters");

  const hash = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: userId },
    data: { password_hash: hash },
  });

  return { success: true };
};

export const toggleActive = async (userId: string) => {
  const user = await getUserOrFail(userId, { is_active: true });

  return prisma.user.update({
    where: { id: userId },
    data: { is_active: !user.is_active },
    select: { id: true, is_active: true },
  });
};

export const deleteAccount = async (
  userId: string,
  password: string,
  reason: string,
) => {
  // Verify password first
  const user = await getUserOrFail(userId, {
    password_hash: true,
    provider: true,
  });

  if (user.provider === "local" && user.password_hash) {
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) throw new Error("Incorrect password");
  }

  // Log the deletion reason (you can store this in a separate audit table)
  console.log(`Account deletion reason for user ${userId}: ${reason}`);

  return prisma.$transaction(async (tx: any) => {
    // Soft delete - anonymize user data
    await tx.user.update({
      where: { id: userId },
      data: {
        is_active: false,
        display_name: "Deleted User",
        bio: null,
        avatar_url: null,
        account_name: `deleted_${userId}`,
        email: `deleted_${userId}@deleted.com`,
        username: `deleted_${userId}`,
        password_hash: null,
      },
    });

    // Delete or anonymize related data
    await tx.post.updateMany({
      where: { user_id: userId },
      data: { content: "[Deleted]", media_urls: null },
    });

    await tx.follow.deleteMany({
      where: {
        OR: [{ follower_id: userId }, { followed_id: userId }],
      },
    });

    await tx.block.deleteMany({
      where: {
        OR: [{ blocker_id: userId }, { blocked_id: userId }],
      },
    });

    // Delete user settings
    await tx.userSettings.deleteMany({
      where: { user_id: userId },
    });

    return { success: true };
  });
};

/* PRIVACY */
export const getPrivacySettings = async (userId: string) => {
  const user = await getUserOrFail(userId, { is_private: true });
  const settings = await getOrCreateUserSettings(userId);

  const pending = await prisma.follow.count({
    where: { followed_id: userId, status: "pending" },
  });

  return {
    is_private: user.is_private,
    showActivityStatus: settings.show_activity_status,
    allowStorySharing: settings.allow_story_sharing,
    whoCanSeeYourPosts: settings.who_can_see_posts,
    whoCanSeeYourStories: settings.who_can_see_stories,
    taggedPostsApproval: settings.tagged_posts_approval,
    whoCanContact: settings.who_can_contact,
    commentFiltering: settings.comment_filtering,
    hideOffensiveWords: settings.hide_offensive_words,
    pending_requests_count: pending,
  };
};

export const updatePrivacySettings = async (userId: string, data: any) => {
  const settings = await getOrCreateUserSettings(userId);

  const updateData: any = {};

  // Map camelCase to snake_case for Prisma
  if (data.showActivityStatus !== undefined)
    updateData.show_activity_status = data.showActivityStatus;
  if (data.allowStorySharing !== undefined)
    updateData.allow_story_sharing = data.allowStorySharing;
  if (data.whoCanSeeYourPosts !== undefined)
    updateData.who_can_see_posts = data.whoCanSeeYourPosts;
  if (data.whoCanSeeYourStories !== undefined)
    updateData.who_can_see_stories = data.whoCanSeeYourStories;
  if (data.taggedPostsApproval !== undefined)
    updateData.tagged_posts_approval = data.taggedPostsApproval;
  if (data.whoCanContact !== undefined)
    updateData.who_can_contact = data.whoCanContact;
  if (data.commentFiltering !== undefined)
    updateData.comment_filtering = data.commentFiltering;
  if (data.hideOffensiveWords !== undefined)
    updateData.hide_offensive_words = data.hideOffensiveWords;

  const updated = await prisma.userSettings.update({
    where: { user_id: userId },
    data: updateData,
  });

  return {
    is_private: (await getUserOrFail(userId, { is_private: true })).is_private,
    showActivityStatus: updated.show_activity_status,
    allowStorySharing: updated.allow_story_sharing,
    whoCanSeeYourPosts: updated.who_can_see_posts,
    whoCanSeeYourStories: updated.who_can_see_stories,
    taggedPostsApproval: updated.tagged_posts_approval,
    whoCanContact: updated.who_can_contact,
    commentFiltering: updated.comment_filtering,
    hideOffensiveWords: updated.hide_offensive_words,
  };
};

export const togglePrivate = async (userId: string) => {
  const user = await getUserOrFail(userId, { is_private: true });

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { is_private: !user.is_private },
    select: { is_private: true },
  });

  // Auto-accept pending follow requests when making account public
  if (!updated.is_private) {
    await prisma.follow.updateMany({
      where: { followed_id: userId, status: "pending" },
      data: { status: "accepted" },
    });
  }

  return updated;
};

/* NOTIFICATIONS */
export const getNotifications = async (
  userId: string,
  page = 1,
  limit = 20,
) => {
  const skip = (page - 1) * limit;

  const [items, total, unread] = await Promise.all([
    prisma.notification.findMany({
      where: { user_id: userId },
      orderBy: { created_at: "desc" },
      skip,
      take: limit,
      include: {
        typeNotification: true,
        user: {
          select: {
            id: true,
            display_name: true,
            avatar_url: true,
          },
        },
      },
    }),
    prisma.notification.count({ where: { user_id: userId } }),
    prisma.notification.count({
      where: { user_id: userId, is_read: false },
    }),
  ]);

  return {
    items,
    total,
    unread,
    page,
    totalPages: Math.ceil(total / limit),
  };
};

export const getNotificationSettings = async (userId: string) => {
  const settings = await getOrCreateUserSettings(userId);

  return {
    all: settings.notifications_all,
    channels: {
      push: settings.notifications_push,
      email: settings.notifications_email,
      inApp: settings.notifications_in_app,
    },
    likes: settings.notifications_likes,
    comments: settings.notifications_comments,
    follows: settings.notifications_follows,
    mentions: settings.notifications_mentions,
    reposts: settings.notifications_reposts,
    timing: settings.notifications_timing,
    messageRequests: settings.notifications_msg_requests,
    groupMessages: settings.notifications_group_msgs,
    videoCalls: settings.notifications_video_calls,
  };
};

export const updateNotificationSettings = async (userId: string, data: any) => {
  const settings = await getOrCreateUserSettings(userId);

  const updateData: any = {};

  // Map camelCase to snake_case
  if (data.all !== undefined) updateData.notifications_all = data.all;
  if (data.channels) {
    if (data.channels.push !== undefined)
      updateData.notifications_push = data.channels.push;
    if (data.channels.email !== undefined)
      updateData.notifications_email = data.channels.email;
    if (data.channels.inApp !== undefined)
      updateData.notifications_in_app = data.channels.inApp;
  }
  if (data.likes !== undefined) updateData.notifications_likes = data.likes;
  if (data.comments !== undefined)
    updateData.notifications_comments = data.comments;
  if (data.follows !== undefined)
    updateData.notifications_follows = data.follows;
  if (data.mentions !== undefined)
    updateData.notifications_mentions = data.mentions;
  if (data.reposts !== undefined)
    updateData.notifications_reposts = data.reposts;
  if (data.timing !== undefined) updateData.notifications_timing = data.timing;
  if (data.messageRequests !== undefined)
    updateData.notifications_msg_requests = data.messageRequests;
  if (data.groupMessages !== undefined)
    updateData.notifications_group_msgs = data.groupMessages;
  if (data.videoCalls !== undefined)
    updateData.notifications_video_calls = data.videoCalls;

  const updated = await prisma.userSettings.update({
    where: { user_id: userId },
    data: updateData,
  });

  return {
    all: updated.notifications_all,
    channels: {
      push: updated.notifications_push,
      email: updated.notifications_email,
      inApp: updated.notifications_in_app,
    },
    likes: updated.notifications_likes,
    comments: updated.notifications_comments,
    follows: updated.notifications_follows,
    mentions: updated.notifications_mentions,
    reposts: updated.notifications_reposts,
    timing: updated.notifications_timing,
    messageRequests: updated.notifications_msg_requests,
    groupMessages: updated.notifications_group_msgs,
    videoCalls: updated.notifications_video_calls,
  };
};

export const markAllNotificationsRead = async (userId: string) => {
  await prisma.notification.updateMany({
    where: { user_id: userId, is_read: false },
    data: { is_read: true },
  });

  return { success: true };
};

/* APPEARANCE */
export const getAppearanceSettings = async (userId: string) => {
  const settings = await getOrCreateUserSettings(userId);

  return {
    theme: settings.theme,
    fontSize: settings.font_size,
    layoutDensity: settings.layout_density,
    language: settings.language,
    accessibility: {
      highContrast: settings.high_contrast,
      reducedMotion: settings.reduced_motion,
      screenReader: settings.screen_reader,
      largerTouchTargets: settings.larger_touch_targets,
    },
  };
};

export const updateAppearanceSettings = async (userId: string, data: any) => {
  const settings = await getOrCreateUserSettings(userId);

  const updateData: any = {};

  // Map camelCase to snake_case
  if (data.theme !== undefined) updateData.theme = data.theme;
  if (data.fontSize !== undefined) updateData.font_size = data.fontSize;
  if (data.layoutDensity !== undefined)
    updateData.layout_density = data.layoutDensity;
  if (data.language !== undefined) updateData.language = data.language;

  if (data.accessibility) {
    if (data.accessibility.highContrast !== undefined)
      updateData.high_contrast = data.accessibility.highContrast;
    if (data.accessibility.reducedMotion !== undefined)
      updateData.reduced_motion = data.accessibility.reducedMotion;
    if (data.accessibility.screenReader !== undefined)
      updateData.screen_reader = data.accessibility.screenReader;
    if (data.accessibility.largerTouchTargets !== undefined)
      updateData.larger_touch_targets = data.accessibility.largerTouchTargets;
  }

  const updated = await prisma.userSettings.update({
    where: { user_id: userId },
    data: updateData,
  });

  return {
    theme: updated.theme,
    fontSize: updated.font_size,
    layoutDensity: updated.layout_density,
    language: updated.language,
    accessibility: {
      highContrast: updated.high_contrast,
      reducedMotion: updated.reduced_motion,
      screenReader: updated.screen_reader,
      largerTouchTargets: updated.larger_touch_targets,
    },
  };
};

/* ALL SETTINGS (GLOBAL) */
export const getAllSettings = async (userId: string) => {
  const [account, privacy, notifications, appearance] = await Promise.all([
    getAccount(userId),
    getPrivacySettings(userId),
    getNotificationSettings(userId),
    getAppearanceSettings(userId),
  ]);

  return {
    account,
    privacy,
    notifications,
    appearance,
  };
};
