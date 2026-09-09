import prisma from '../util/prisma';
import { AppError } from '../util/error';
import { StoryService } from './story.service';
import { NotificationService } from './notificationService';
import { emitToUser } from '../realtime/io';

const userSelect = {
  id: true,
  username: true,
  display_name: true,
  avatar_url: true,
} as const;

export class StoryQuestionService {
  private static findQuestion(overlays: unknown, overlayId: string) {
    const list = Array.isArray(overlays) ? (overlays as any[]) : [];
    return list.find((o) => o && o.id === overlayId && o.type === 'question') ?? null;
  }

  static async respond(storyId: string, userId: string, overlayId: string, answer: string) {
    const text = (answer ?? '').trim();
    if (!text) throw new AppError('Empty answer', 400);
    if (text.length > 500) throw new AppError('Answer is too long (max 500)', 400);

    // ensures the story exists, is live and visible to the responder
    const story = await StoryService.getStoryById(storyId, userId);
    if (!this.findQuestion(story.overlays, overlayId)) {
      throw new AppError('Question not found', 404);
    }
    if (story.user_id === userId) {
      throw new AppError('You cannot answer your own question', 400);
    }

    const response = await prisma.storyQuestionResponse.create({
      data: { story_id: storyId, overlay_id: overlayId, user_id: userId, answer: text },
      include: { user: { select: userSelect } },
    });

    await NotificationService.createStoryReactionNotification(
      story.user_id,
      userId,
      storyId,
      '💬'
    );
    emitToUser(story.user_id, 'story:question', {
      story_id: storyId,
      overlay_id: overlayId,
      answer: text,
      user: response.user,
    });

    return { id: response.id, answer: response.answer, created_at: response.created_at };
  }

  /** Author-only: all answers to one question sticker. */
  static async list(storyId: string, overlayId: string, userId: string) {
    const story = await prisma.story.findUnique({
      where: { id: storyId },
      select: { user_id: true, overlays: true },
    });
    if (!story) throw new AppError('Story not found', 404);
    if (story.user_id !== userId) {
      throw new AppError("You are not allowed to see these responses", 403);
    }
    if (!this.findQuestion(story.overlays, overlayId)) {
      throw new AppError('Question not found', 404);
    }

    const responses = await prisma.storyQuestionResponse.findMany({
      where: { story_id: storyId, overlay_id: overlayId },
      include: { user: { select: userSelect } },
      orderBy: { created_at: 'desc' },
    });
    return responses.map((r) => ({
      id: r.id,
      answer: r.answer,
      created_at: r.created_at,
      user: r.user,
    }));
  }
}
