import prisma from '../util/prisma';
import { AppError } from '../util/error';
import { ConversationService } from './conversation.service';
import { getBlockedUserIds } from './BlockService';
import { visiblePostWhere } from './postVisibility';

const MAX_RECIPIENTS = 25;

export class PostShareService {
  /**
   * Sends a post into one or more direct conversations ("Share via
   * messages"). Each recipient gets a message_type "post" card. Only people
   * who may see the post themselves (visibility, private account, blocks)
   * receive it, so sharing never widens who can read a post.
   */
  static async shareToUsers(postId: string, senderId: string, recipientIds: string[], note?: string) {
    const uniqueRecipients = [...new Set(recipientIds)].filter((id) => typeof id === 'string' && id && id !== senderId);
    if (uniqueRecipients.length === 0) throw new AppError('No valid recipient', 400);
    if (uniqueRecipients.length > MAX_RECIPIENTS) {
      throw new AppError(`Too many recipients (max ${MAX_RECIPIENTS})`, 400);
    }
    const trimmedNote = note?.trim() || null;
    if (trimmedNote && trimmedNote.length > 1000) throw new AppError('Message is too long', 400);

    const senderBlocked = await getBlockedUserIds(senderId);
    const post = await prisma.post.findFirst({
      where: { id: postId, user_id: { notIn: senderBlocked }, ...visiblePostWhere(senderId) },
      select: { id: true, user_id: true },
    });
    if (!post) throw new AppError('Post not found', 404);

    const candidates = await prisma.user.findMany({
      where: { id: { in: uniqueRecipients, notIn: senderBlocked }, is_active: true },
      select: { id: true },
    });

    let sharedCount = 0;
    for (const { id: recipientId } of candidates) {
      const recipientBlocked = await getBlockedUserIds(recipientId);
      if (recipientBlocked.includes(post.user_id)) continue;
      const visible = await prisma.post.count({ where: { id: post.id, ...visiblePostWhere(recipientId) } });
      if (!visible) continue;

      await ConversationService.sendPostShare(senderId, recipientId, post.id, trimmedNote);
      sharedCount++;
    }

    return { shared_count: sharedCount, skipped_count: uniqueRecipients.length - sharedCount };
  }
}
