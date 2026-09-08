import prisma from '../util/prisma';
import { AppError } from '../util/error';

const storyUserSelect = {
  id: true,
  username: true,
  display_name: true,
  avatar_url: true,
} as const;

const mapStory = (story: any) => ({
  ...story,
  music: story.music_preview_url
    ? {
        track_id: story.music_track_id,
        title: story.music_title,
        artist: story.music_artist,
        cover_url: story.music_cover_url,
        preview_url: story.music_preview_url,
        start_sec: story.music_start_sec ?? 0,
      }
    : null,
});

export class HighlightService {
  private static async assertOwnedStories(userId: string, storyIds: string[]) {
    if (storyIds.length === 0) return [];
    const stories = await prisma.story.findMany({
      where: { id: { in: storyIds }, user_id: userId },
      select: { id: true, thumbnail_url: true, content_url: true, content_type: true },
    });
    if (stories.length !== new Set(storyIds).size) {
      throw new AppError("Certaines stories sont introuvables ou ne vous appartiennent pas", 400);
    }
    return stories;
  }

  private static coverFrom(stories: { thumbnail_url: string | null; content_url: string; content_type: string }[]) {
    const first = stories[0];
    if (!first) return null;
    if (first.content_type === 'image') return first.content_url;
    return first.thumbnail_url ?? null;
  }

  static async create(
    userId: string,
    data: { title: string; cover_url?: string; story_ids?: string[] }
  ) {
    const title = (data.title ?? '').trim();
    if (!title) throw new AppError('Le titre est requis', 400);
    if (title.length > 60) throw new AppError('Titre trop long (max 60)', 400);

    const storyIds = [...new Set(data.story_ids ?? [])];
    const stories = await this.assertOwnedStories(userId, storyIds);

    const highlight = await prisma.highlight.create({
      data: {
        user_id: userId,
        title,
        cover_url: data.cover_url || this.coverFrom(stories),
        items: {
          create: storyIds.map((story_id, i) => ({ story_id, position: i })),
        },
      },
      include: { _count: { select: { items: true } } },
    });

    return { ...highlight, item_count: highlight._count.items };
  }

  static async listForUser(ownerId: string) {
    const highlights = await prisma.highlight.findMany({
      where: { user_id: ownerId },
      orderBy: { updated_at: 'desc' },
      include: { _count: { select: { items: true } } },
    });
    return highlights.map((h) => ({
      id: h.id,
      title: h.title,
      cover_url: h.cover_url,
      item_count: h._count.items,
      updated_at: h.updated_at,
    }));
  }

  static async getById(id: string) {
    const highlight = await prisma.highlight.findUnique({
      where: { id },
      include: {
        user: { select: storyUserSelect },
        items: {
          orderBy: { position: 'asc' },
          include: { story: { include: { user: { select: storyUserSelect } } } },
        },
      },
    });
    if (!highlight) throw new AppError('Highlight introuvable', 404);

    return {
      id: highlight.id,
      title: highlight.title,
      cover_url: highlight.cover_url,
      user: highlight.user,
      items: highlight.items.map((it) => mapStory(it.story)),
    };
  }

  private static async assertOwner(id: string, userId: string) {
    const h = await prisma.highlight.findUnique({ where: { id }, select: { user_id: true } });
    if (!h) throw new AppError('Highlight introuvable', 404);
    if (h.user_id !== userId) throw new AppError('Action non autorisée', 403);
  }

  static async update(
    id: string,
    userId: string,
    data: { title?: string; cover_url?: string; story_ids?: string[] }
  ) {
    await this.assertOwner(id, userId);

    if (Array.isArray(data.story_ids)) {
      const storyIds = [...new Set(data.story_ids)];
      await this.assertOwnedStories(userId, storyIds);
      await prisma.$transaction([
        prisma.highlightItem.deleteMany({ where: { highlight_id: id } }),
        ...storyIds.map((story_id, i) =>
          prisma.highlightItem.create({ data: { highlight_id: id, story_id, position: i } })
        ),
      ]);
    }

    const patch: Record<string, unknown> = {};
    if (typeof data.title === 'string') {
      const t = data.title.trim();
      if (!t || t.length > 60) throw new AppError('Titre invalide', 400);
      patch.title = t;
    }
    if (typeof data.cover_url === 'string') patch.cover_url = data.cover_url || null;

    const highlight = await prisma.highlight.update({
      where: { id },
      data: { ...patch, updated_at: new Date() },
      include: { _count: { select: { items: true } } },
    });
    return { ...highlight, item_count: highlight._count.items };
  }

  static async addItems(id: string, userId: string, storyIds: string[]) {
    await this.assertOwner(id, userId);
    const ids = [...new Set(storyIds)];
    await this.assertOwnedStories(userId, ids);

    const last = await prisma.highlightItem.aggregate({
      where: { highlight_id: id },
      _max: { position: true },
    });
    let pos = (last._max.position ?? -1) + 1;

    for (const story_id of ids) {
      await prisma.highlightItem.upsert({
        where: { highlight_id_story_id: { highlight_id: id, story_id } },
        update: {},
        create: { highlight_id: id, story_id, position: pos++ },
      });
    }
    await prisma.highlight.update({ where: { id }, data: { updated_at: new Date() } });
    return { message: 'Ajouté au highlight' };
  }

  static async removeItem(id: string, userId: string, storyId: string) {
    await this.assertOwner(id, userId);
    await prisma.highlightItem.deleteMany({ where: { highlight_id: id, story_id: storyId } });

    const remaining = await prisma.highlightItem.count({ where: { highlight_id: id } });
    if (remaining === 0) {
      await prisma.highlight.delete({ where: { id } });
      return { message: 'Highlight supprimé (vide)', deleted: true };
    }
    await prisma.highlight.update({ where: { id }, data: { updated_at: new Date() } });
    return { message: 'Retiré du highlight', deleted: false };
  }

  static async remove(id: string, userId: string) {
    await this.assertOwner(id, userId);
    await prisma.highlightItem.deleteMany({ where: { highlight_id: id } });
    await prisma.highlight.delete({ where: { id } });
    return { message: 'Highlight supprimé' };
  }
}
