import prisma from '../util/prisma';
import { AppError } from '../util/error';
import { StoryService } from './story.service';
import { emitToUser } from '../realtime/io';

interface PollResult {
  counts: Record<number, number>;
  total: number;
  my_choice: number | null;
}

export class StoryPollService {
  private static findPoll(overlays: unknown, overlayId: string) {
    const list = Array.isArray(overlays) ? (overlays as any[]) : [];
    return list.find((o) => o && o.id === overlayId && o.type === 'poll') ?? null;
  }

  static async vote(storyId: string, userId: string, overlayId: string, optionIndex: number) {
    // ensures the story exists, is live and visible to the voter
    const story = await StoryService.getStoryById(storyId, userId);

    const poll = this.findPoll(story.overlays, overlayId);
    if (!poll) throw new AppError('Poll not found', 404);
    if (story.user_id === userId) {
      throw new AppError('You cannot vote on your own poll', 400);
    }
    const optionCount = Array.isArray(poll.options) ? poll.options.length : 0;
    if (!Number.isInteger(optionIndex) || optionIndex < 0 || optionIndex >= optionCount) {
      throw new AppError('Invalid option', 400);
    }

    await prisma.storyPollVote.upsert({
      where: {
        story_id_overlay_id_user_id: {
          story_id: storyId,
          overlay_id: overlayId,
          user_id: userId,
        },
      },
      update: { option_index: optionIndex },
      create: { story_id: storyId, overlay_id: overlayId, user_id: userId, option_index: optionIndex },
    });

    const result = await this.tally(storyId, overlayId, userId);
    emitToUser(story.user_id, 'story:poll', { story_id: storyId, overlay_id: overlayId, ...result });
    return result;
  }

  private static async tally(storyId: string, overlayId: string, viewerId: string): Promise<PollResult> {
    const votes = await prisma.storyPollVote.findMany({
      where: { story_id: storyId, overlay_id: overlayId },
      select: { option_index: true, user_id: true },
    });
    const counts: Record<number, number> = {};
    let mine: number | null = null;
    for (const v of votes) {
      counts[v.option_index] = (counts[v.option_index] ?? 0) + 1;
      if (v.user_id === viewerId) mine = v.option_index;
    }
    return { counts, total: votes.length, my_choice: mine };
  }

  /**
   * Poll results. Counts are hidden until the viewer has voted, unless they are
   * the story author.
   */
  static async getResults(storyId: string, overlayId: string, viewerId: string) {
    const story = await prisma.story.findUnique({
      where: { id: storyId },
      select: { user_id: true, overlays: true },
    });
    if (!story) throw new AppError('Story not found', 404);
    if (!this.findPoll(story.overlays, overlayId)) throw new AppError('Poll not found', 404);

    const result = await this.tally(storyId, overlayId, viewerId);
    const reveal = story.user_id === viewerId || result.my_choice !== null;
    return reveal ? result : { total: result.total, my_choice: null, counts: null };
  }
}
