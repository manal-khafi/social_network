import prisma from '../util/prisma';
import { AppError } from '../util/error';
import { RelationshipService } from './relationship.service';
import { NotificationService } from './notificationService';
import { MusicService } from './musicService';
import { emitToUsers } from '../realtime/io';

// Hosts we trust for client-supplied music preview / cover URLs when the
// authoritative provider lookup is unavailable.
const ALLOWED_MUSIC_HOSTS = [
  /(^|\.)mzstatic\.com$/,
  /(^|\.)apple\.com$/,
  /(^|\.)deezer\.com$/,
  /(^|\.)dzcdn\.net$/,
];

const isAllowedMusicUrl = (url?: string | null): url is string => {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === 'https:' &&
      ALLOWED_MUSIC_HOSTS.some((re) => re.test(parsed.hostname))
    );
  } catch {
    return false;
  }
};

const storyUserSelect = {
  id: true,
  username: true,
  display_name: true,
  avatar_url: true,
} as const;

const storyInclude = {
  user: { select: storyUserSelect },
  sharedPost: { include: { user: { select: storyUserSelect } } },
  sharedStory: { include: { user: { select: storyUserSelect } } },
  _count: { select: { views: true, likes: true, comments: true, reactions: true } },
} as const;

interface InteractionSets {
  viewed: Set<string>;
  liked: Set<string>;
  reactions: Map<string, string>;
}

const EMPTY_SETS: InteractionSets = {
  viewed: new Set(),
  liked: new Set(),
  reactions: new Map(),
};

export interface CreateStoryInput {
  content_url: string;
  content_type: 'image' | 'video' | 'text' | 'link';
  visibility?: 'public' | 'friends' | 'close_friends';
  duration_hours?: number;
  caption?: string;
  thumbnail_url?: string;
  duration_sec?: number;
  bg_color?: string;
  overlays?: unknown;
  music?: {
    track_id?: string;
    title?: string;
    artist?: string;
    cover_url?: string;
    preview_url?: string;
    start_sec?: number;
  } | null;
  shared_post_id?: string;
  shared_story_id?: string;
}

export class StoryService {
  private static lastArchiveSweep = 0;

  private static hydrate(story: any, userId: string, sets: InteractionSets) {
    const music = story.music_preview_url
      ? {
          track_id: story.music_track_id,
          title: story.music_title,
          artist: story.music_artist,
          cover_url: story.music_cover_url,
          preview_url: story.music_preview_url,
          start_sec: story.music_start_sec ?? 0,
        }
      : null;

    return {
      ...story,
      music,
      has_viewed: sets.viewed.has(story.id) || story.user_id === userId,
      has_liked: sets.liked.has(story.id),
      my_reaction: sets.reactions.get(story.id) ?? null,
    };
  }

  private static async loadInteractions(userId: string, storyIds: string[]): Promise<InteractionSets> {
    if (storyIds.length === 0) return EMPTY_SETS;
    const [views, likes, reactions] = await Promise.all([
      prisma.storyView.findMany({
        where: { viewer_id: userId, story_id: { in: storyIds } },
        select: { story_id: true },
      }),
      prisma.storyLike.findMany({
        where: { user_id: userId, story_id: { in: storyIds } },
        select: { story_id: true },
      }),
      prisma.storyReaction.findMany({
        where: { user_id: userId, story_id: { in: storyIds } },
        select: { story_id: true, emoji: true },
      }),
    ]);
    return {
      viewed: new Set(views.map((v) => v.story_id)),
      liked: new Set(likes.map((l) => l.story_id)),
      reactions: new Map(reactions.map((r) => [r.story_id, r.emoji])),
    };
  }

  private static async resolveReshareTargets(userId: string, data: CreateStoryInput) {
    let sharedPostOwnerId: string | null = null;
    let sharedStoryOwnerId: string | null = null;

    if (data.shared_post_id) {
      const post = await prisma.post.findUnique({
        where: { id: data.shared_post_id },
        select: { id: true, user_id: true, is_deleted: true, visibility: true },
      });
      if (!post || post.is_deleted) throw new AppError('Post not found', 404);
      if (post.visibility !== 'public' && post.user_id !== userId) {
        throw new AppError('This post cannot be reshared', 403);
      }
      sharedPostOwnerId = post.user_id;
    }

    if (data.shared_story_id) {
      const src = await prisma.story.findUnique({
        where: { id: data.shared_story_id },
        select: { id: true, user_id: true, visibility: true, expires_at: true },
      });
      if (!src) throw new AppError('Story not found', 404);
      if (src.visibility !== 'public' && src.user_id !== userId) {
        throw new AppError('This story cannot be reshared', 403);
      }
      sharedStoryOwnerId = src.user_id;
    }

    return { sharedPostOwnerId, sharedStoryOwnerId };
  }

  /**
   * Re-derive the music metadata from the authoritative provider (never trust
   * the client-supplied preview URL). Falls back to the client payload only when
   * the lookup is unavailable AND the URLs are on a trusted CDN.
   */
  private static async resolveMusic(input: CreateStoryInput['music']) {
    if (!input || !input.track_id) return null;

    const startSec = Math.max(0, Math.min(300, Math.round(Number(input.start_sec) || 0)));

    const track = await MusicService.getTrack(input.track_id).catch(() => null);
    if (track) {
      return {
        track_id: track.track_id,
        title: track.title,
        artist: track.artist,
        cover_url: track.cover_url,
        preview_url: track.preview_url,
        start_sec: startSec,
      };
    }

    if (isAllowedMusicUrl(input.preview_url)) {
      return {
        track_id: input.track_id,
        title: input.title ?? null,
        artist: input.artist ?? null,
        cover_url: isAllowedMusicUrl(input.cover_url) ? input.cover_url! : null,
        preview_url: input.preview_url!,
        start_sec: startSec,
      };
    }

    throw new AppError("Could not validate the selected track", 400);
  }

  /**
   * Create a story. Supports plain media, text stories, attached music,
   * draggable overlays and re-sharing a post / another story.
   */
  static async createStory(userId: string, data: CreateStoryInput) {
    if (!data.content_url || typeof data.content_url !== 'string') {
      throw new AppError('Story content is required', 400);
    }

    const { sharedPostOwnerId, sharedStoryOwnerId } = await this.resolveReshareTargets(userId, data);
    const music = await this.resolveMusic(data.music);

    const durationHours = data.duration_hours || 24;
    const expiresAt = new Date(Date.now() + durationHours * 60 * 60 * 1000);

    const story = await prisma.story.create({
      data: {
        content_url: data.content_url,
        content_type: data.content_type as any,
        visibility: (data.visibility || 'public') as any,
        caption: data.caption?.trim() || null,
        thumbnail_url: data.thumbnail_url || null,
        duration_sec: data.duration_sec ?? null,
        bg_color: data.bg_color || null,
        overlays: (data.overlays as any) ?? undefined,
        music_track_id: music?.track_id ?? null,
        music_title: music?.title ?? null,
        music_artist: music?.artist ?? null,
        music_cover_url: music?.cover_url ?? null,
        music_preview_url: music?.preview_url ?? null,
        music_start_sec: music?.start_sec ?? 0,
        shared_post_id: data.shared_post_id || null,
        shared_story_id: data.shared_story_id || null,
        duration_hours: durationHours,
        expires_at: expiresAt,
        user_id: userId,
      },
      include: storyInclude,
    });

    if (sharedPostOwnerId) {
      await NotificationService.createStoryReshareNotification(sharedPostOwnerId, userId, story.id);
    }
    if (sharedStoryOwnerId) {
      await NotificationService.createStoryReshareNotification(sharedStoryOwnerId, userId, story.id);
    }

    // Nudge accepted followers so their story bar refreshes live.
    const followers = await prisma.follow.findMany({
      where: { followed_id: userId, status: 'accepted' },
      select: { follower_id: true },
    });
    emitToUsers(
      followers.map((f) => f.follower_id),
      'story:new',
      { user_id: userId, story_id: story.id }
    );

    return this.hydrate(story, userId, EMPTY_SETS);
  }

  /**
   * Instagram-style grouped feed: one entry per author with their live stories,
   * own story first, then rings with unseen segments, then most recent.
   */
  static async getStoriesFeed(userId: string) {
    const now = new Date();

    // Opportunistic, throttled housekeeping instead of an in-process interval
    // (idempotent updateMany -> safe with multiple instances, no cron needed).
    if (Date.now() - StoryService.lastArchiveSweep > 10 * 60 * 1000) {
      StoryService.lastArchiveSweep = Date.now();
      StoryService.archiveExpiredStories().catch(() => {});
    }

    const [all, visibilityCtx] = await Promise.all([
      prisma.story.findMany({
        where: { expires_at: { gt: now }, is_archived: false },
        include: storyInclude,
        orderBy: { created_at: 'asc' },
      }),
      RelationshipService.getStoryVisibilityContext(userId),
    ]);

    const visible = all.filter((story) =>
      RelationshipService.canViewStoryWithContext(visibilityCtx, userId, story)
    );

    const sets = await this.loadInteractions(userId, visible.map((s) => s.id));

    const groups = new Map<
      string,
      { user: any; items: any[]; has_unseen: boolean; latest_at: Date }
    >();

    for (const story of visible) {
      const hydrated = this.hydrate(story, userId, sets);
      let group = groups.get(story.user_id);
      if (!group) {
        group = { user: story.user, items: [], has_unseen: false, latest_at: story.created_at };
        groups.set(story.user_id, group);
      }
      group.items.push(hydrated);
      if (!hydrated.has_viewed) group.has_unseen = true;
      if (story.created_at > group.latest_at) group.latest_at = story.created_at;
    }

    const list = [...groups.values()];
    list.sort((a, b) => {
      if (a.user.id === userId) return -1;
      if (b.user.id === userId) return 1;
      if (a.has_unseen !== b.has_unseen) return a.has_unseen ? -1 : 1;
      return new Date(b.latest_at).getTime() - new Date(a.latest_at).getTime();
    });

    return list.map((g) => ({
      user: g.user,
      has_unseen: g.has_unseen,
      latest_at: g.latest_at,
      items: g.items,
    }));
  }

  /** Flat list of live stories visible to the user (kept for backwards compat). */
  static async getVisibleStories(userId: string) {
    const groups = await this.getStoriesFeed(userId);
    return groups.flatMap((g) => g.items);
  }

  static async getStoryById(storyId: string, userId: string) {
    const story = await prisma.story.findUnique({
      where: { id: storyId },
      include: storyInclude,
    });

    if (!story) throw new AppError('Story not found', 404);
    if (new Date() > story.expires_at) throw new AppError('This story has expired', 410);

    const canView = await RelationshipService.canViewStory(
      userId,
      story.user_id,
      story.visibility
    );
    if (!canView) throw new AppError("You don't have access to this story", 403);

    const sets = await this.loadInteractions(userId, [story.id]);
    return this.hydrate(story, userId, sets);
  }

  /** All live stories of one author, in chronological order, for the viewer. */
  static async getUserStories(ownerId: string, viewerId: string) {
    const now = new Date();

    const owner = await prisma.user.findUnique({
      where: { id: ownerId },
      select: storyUserSelect,
    });
    if (!owner) throw new AppError('User not found', 404);

    const [stories, visibilityCtx] = await Promise.all([
      prisma.story.findMany({
        where: { user_id: ownerId, expires_at: { gt: now }, is_archived: false },
        include: storyInclude,
        orderBy: { created_at: 'asc' },
      }),
      viewerId === ownerId
        ? Promise.resolve(null)
        : RelationshipService.getStoryVisibilityContext(viewerId),
    ]);

    const visible =
      viewerId === ownerId || !visibilityCtx
        ? stories
        : stories.filter((story) =>
            RelationshipService.canViewStoryWithContext(visibilityCtx, viewerId, story)
          );

    const sets = await this.loadInteractions(viewerId, visible.map((s) => s.id));
    return {
      user: owner,
      items: visible.map((s) => this.hydrate(s, viewerId, sets)),
    };
  }

  static async deleteStory(storyId: string, userId: string) {
    const story = await prisma.story.findUnique({ where: { id: storyId } });
    if (!story) throw new AppError('Story not found', 404);
    if (story.user_id !== userId) {
      throw new AppError("You are not allowed to delete this story", 403);
    }

    await prisma.story.update({
      where: { id: storyId },
      data: { is_archived: true },
    });

    return { message: 'Story deleted' };
  }

  static async archiveExpiredStories() {
    const result = await prisma.story.updateMany({
      where: { expires_at: { lte: new Date() }, is_archived: false },
      data: { is_archived: true },
    });
    return { archived_count: result.count };
  }
}
