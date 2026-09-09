import prisma from '../util/prisma';
import { AppError } from '../util/error';
import { StoryService } from './story.service';
import { NotificationService } from './notificationService';
import { getOrCreateDirectConversation } from '../util/conversation';
import { emitToUser } from '../realtime/io';

export class StoryMessageService {
  /**
   * Reply to a story by private message. The recipient is always the story
   * author (Instagram behaviour); `recipientId` is optional and validated if
   * provided.
   */
  static async sendMessageToStory(
    storyId: string,
    senderId: string,
    recipientId: string | undefined,
    content: string
  ) {
    // Ensures the story exists, is live and visible to the sender.
    const story = await StoryService.getStoryById(storyId, senderId);
    const target = recipientId || story.user_id;

    if (target !== story.user_id) {
      throw new AppError('The recipient must be the story author', 400);
    }
    if (senderId === target) {
      throw new AppError('You cannot reply to your own story', 400);
    }

    const conversation = await getOrCreateDirectConversation(senderId, target);

    const message = await prisma.message.create({
      data: {
        conversation_id: conversation.id,
        sender_id: senderId,
        story_id: storyId,
        content: content.trim(),
        message_type: 'text',
      },
      include: {
        sender: {
          select: { id: true, username: true, display_name: true, avatar_url: true },
        },
      },
    });

    await prisma.messageStatus.create({
      data: { message_id: message.id, user_id: target, status: 'sent' },
    });

    await NotificationService.createStoryMessageNotification(
      target,
      senderId,
      storyId,
      message.id
    );

    emitToUser(target, 'message:new', { ...message, conversation_id: conversation.id });
    emitToUser(target, 'story:reply', {
      story_id: storyId,
      message_id: message.id,
      sender: message.sender,
      content: message.content,
    });

    return message;
  }

  static async getStoryMessages(storyId: string, userId: string) {
    const story = await prisma.story.findUnique({ where: { id: storyId } });
    if (!story) throw new AppError('Story not found', 404);
    if (story.user_id !== userId) {
      throw new AppError("You are not allowed to see this story's messages", 403);
    }

    return prisma.message.findMany({
      where: { story_id: storyId },
      include: {
        sender: {
          select: { id: true, username: true, display_name: true, avatar_url: true },
        },
      },
      orderBy: { created_at: 'asc' },
    });
  }
}
