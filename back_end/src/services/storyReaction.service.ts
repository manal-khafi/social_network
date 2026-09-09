import prisma from '../util/prisma';
import { AppError } from '../util/error';
import { StoryService } from './story.service';
import { NotificationService } from './notificationService';
import { emitToUser } from '../realtime/io';

// Instagram-style quick reactions. Any single emoji is accepted; the tray in the
// UI offers this default set.
export const QUICK_REACTIONS = ['❤️', '😂', '😮', '😢', '👏', '🔥', '🎉', '😍'];

const userSelect = {
  id: true,
  username: true,
  display_name: true,
  avatar_url: true,
} as const;

export class StoryReactionService {
  /**
   * Add or replace the current user's reaction on a story (one per user).
   */
  static async react(storyId: string, userId: string, emoji: string) {
    const trimmed = (emoji ?? '').trim();
    if (!trimmed || [...trimmed].length > 4) {
      throw new AppError('Invalid reaction emoji', 400);
    }

    // Ensures the story exists, is not expired and is visible to this user.
    const story = await StoryService.getStoryById(storyId, userId);

    const existing = await prisma.storyReaction.findUnique({
      where: { user_id_story_id: { user_id: userId, story_id: storyId } },
    });

    const reaction = await prisma.storyReaction.upsert({
      where: { user_id_story_id: { user_id: userId, story_id: storyId } },
      update: { emoji: trimmed },
      create: { user_id: userId, story_id: storyId, emoji: trimmed },
      include: { user: { select: userSelect } },
    });

    // Notify the author on a new reaction or a changed emoji (not on a no-op).
    if (story.user_id !== userId && (!existing || existing.emoji !== trimmed)) {
      await NotificationService.createStoryReactionNotification(
        story.user_id,
        userId,
        storyId,
        trimmed
      );

      const reactionCount = await prisma.storyReaction.count({ where: { story_id: storyId } });
      emitToUser(story.user_id, 'story:reaction', {
        story_id: storyId,
        emoji: trimmed,
        reaction_count: reactionCount,
        user: reaction.user,
      });
    }

    return reaction;
  }

  static async removeReaction(storyId: string, userId: string) {
    const existing = await prisma.storyReaction.findUnique({
      where: { user_id_story_id: { user_id: userId, story_id: storyId } },
    });
    if (!existing) {
      throw new AppError("You haven't reacted to this story", 400);
    }
    await prisma.storyReaction.delete({
      where: { user_id_story_id: { user_id: userId, story_id: storyId } },
    });
    return { message: 'Reaction removed' };
  }

  /**
   * Reactions on a story — author only. Returns the flat list plus a per-emoji
   * summary for the "seen by" sheet.
   */
  static async getStoryReactions(storyId: string, userId: string) {
    const story = await prisma.story.findUnique({ where: { id: storyId } });
    if (!story) throw new AppError('Story not found', 404);
    if (story.user_id !== userId) {
      throw new AppError("You are not allowed to see this story's reactions", 403);
    }

    const reactions = await prisma.storyReaction.findMany({
      where: { story_id: storyId },
      include: { user: { select: userSelect } },
      orderBy: { created_at: 'desc' },
    });

    const summary: Record<string, number> = {};
    for (const r of reactions) summary[r.emoji] = (summary[r.emoji] ?? 0) + 1;

    return { total: reactions.length, summary, reactions };
  }
}
