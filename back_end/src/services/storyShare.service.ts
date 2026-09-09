import prisma from '../util/prisma';
import { AppError } from '../util/error';
import { StoryService } from './story.service';
import { NotificationService } from './notificationService';
import { getOrCreateDirectConversation } from '../util/conversation';
import { emitToUser } from '../realtime/io';

export class StoryShareService {
  /**
   * Share a story into one or more direct conversations (Instagram "send to").
   * Each recipient gets a message that references the story.
   */
  static async shareToUsers(
    storyId: string,
    senderId: string,
    recipientIds: string[],
    note?: string
  ) {
    const uniqueRecipients = [...new Set(recipientIds)].filter((id) => id && id !== senderId);
    if (uniqueRecipients.length === 0) {
      throw new AppError('No valid recipient', 400);
    }
    if (uniqueRecipients.length > 25) {
      throw new AppError('Too many recipients (max 25)', 400);
    }

    // Confirms the story exists, is live and visible to the sender.
    const story = await StoryService.getStoryById(storyId, senderId);

    const recipients = await prisma.user.findMany({
      where: { id: { in: uniqueRecipients } },
      select: { id: true },
    });
    const validIds = new Set(recipients.map((r) => r.id));

    const trimmedNote = note?.trim();
    const results: { recipient_id: string; message_id: string }[] = [];

    for (const recipientId of uniqueRecipients) {
      if (!validIds.has(recipientId)) continue;

      const conversation = await getOrCreateDirectConversation(senderId, recipientId);

      const message = await prisma.message.create({
        data: {
          conversation_id: conversation.id,
          sender_id: senderId,
          story_id: storyId,
          content: trimmedNote || null,
          message_type: 'text',
        },
      });

      await prisma.messageStatus.create({
        data: { message_id: message.id, user_id: recipientId, status: 'sent' },
      });

      emitToUser(recipientId, 'message:new', {
        ...message,
        conversation_id: conversation.id,
        shared_story_id: storyId,
      });

      results.push({ recipient_id: recipientId, message_id: message.id });
    }

    // Tell the story author their story was shared onward.
    await NotificationService.createStoryShareNotification(story.user_id, senderId, storyId);

    return { shared_count: results.length, results };
  }
}
