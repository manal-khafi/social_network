import prisma from '../util/prisma';
import { AppError } from '../util/error';
import { getOrCreateDirectConversation } from '../util/conversation';
import { emitToUser } from '../realtime/io';

const userSelect = {
  id: true,
  username: true,
  display_name: true,
  avatar_url: true,
} as const;

// The other participant, plus what is needed to decide whether their read
// position may be shown (never returned to the client as is, see splitPeer).
const peerSelect = { ...userSelect, allow_read_receipts: true } as const;

type Peer = {
  user_id: string;
  last_read_at: Date | null;
  user: { id: string; username: string; display_name: string | null; avatar_url: string | null; allow_read_receipts: boolean };
};

/**
 * Splits the other participant into the public user object and the time they
 * last read the conversation — null when they turned read receipts off.
 */
const splitPeer = (participants: Peer[], userId: string) => {
  const peer = participants.find((p) => p.user_id !== userId);
  if (!peer) return { other: null, otherLastReadAt: null };
  const { allow_read_receipts, ...other } = peer.user;
  return { other, otherLastReadAt: allow_read_receipts ? peer.last_read_at : null };
};

// Shared / mentioned story, shown as a card in the chat.
const storyPreviewSelect = {
  id: true,
  user_id: true,
  content_url: true,
  content_type: true,
  thumbnail_url: true,
  bg_color: true,
  caption: true,
  expires_at: true,
  user: { select: userSelect },
} as const;

const messageInclude = {
  sender: { select: userSelect },
  story: { select: storyPreviewSelect },
} as const;

export class ConversationService {
  private static async assertParticipant(conversationId: string, userId: string) {
    const p = await prisma.conversationParticipant.findUnique({
      where: { conversation_id_user_id: { conversation_id: conversationId, user_id: userId } },
    });
    if (!p) throw new AppError('Conversation not found', 404);
    return p;
  }

  /** Direct conversation with another user (created on first use). */
  static async openDirect(userId: string, otherUserId: string) {
    if (otherUserId === userId) throw new AppError('Invalid recipient', 400);
    const other = await prisma.user.findUnique({ where: { id: otherUserId }, select: { id: true } });
    if (!other) throw new AppError('User not found', 404);

    const conv = await getOrCreateDirectConversation(userId, otherUserId);
    return this.getOne(conv.id, userId);
  }

  static async list(userId: string, opts: { archived?: boolean } = {}) {
    const parts = await prisma.conversationParticipant.findMany({
      where: { user_id: userId, is_archived: opts.archived === true },
      include: {
        conversation: {
          include: {
            participants: { include: { user: { select: peerSelect } } },
          },
        },
      },
      orderBy: { conversation: { last_message_at: 'desc' } },
    });

    const result: Array<Record<string, unknown>> = [];
    for (const part of parts) {
      const conv = part.conversation;
      const { other, otherLastReadAt } = splitPeer(conv.participants, userId);

      const last = await prisma.message.findFirst({
        where: { conversation_id: conv.id, is_deleted: false },
        orderBy: { created_at: 'desc' },
        include: messageInclude,
      });

      const unread = await prisma.message.count({
        where: {
          conversation_id: conv.id,
          sender_id: { not: userId },
          is_deleted: false,
          ...(part.last_read_at ? { created_at: { gt: part.last_read_at } } : {}),
        },
      });

      result.push({
        id: conv.id,
        is_group: conv.is_group,
        other_user: other,
        last_message: last ? this.shape(last) : null,
        last_message_at: conv.last_message_at,
        unread_count: unread,
        other_last_read_at: otherLastReadAt,
        is_archived: part.is_archived,
      });
    }
    return result;
  }

  /**
   * Non-archived conversations holding at least one message from someone else
   * that arrived after the user last read them (same rule as unread_count in
   * list()). Feeds the badge on the inbox icon.
   */
  static async unreadConversations(userId: string) {
    const parts = await prisma.conversationParticipant.findMany({
      where: { user_id: userId, is_archived: false },
      select: { conversation_id: true, last_read_at: true },
    });

    const unread = await Promise.all(
      parts.map((part) =>
        prisma.message.findFirst({
          where: {
            conversation_id: part.conversation_id,
            sender_id: { not: userId },
            is_deleted: false,
            ...(part.last_read_at ? { created_at: { gt: part.last_read_at } } : {}),
          },
          select: { id: true },
        })
      )
    );

    const conversationIds = parts.filter((_, i) => unread[i]).map((p) => p.conversation_id);
    return { count: conversationIds.length, conversation_ids: conversationIds };
  }

  static async getOne(conversationId: string, userId: string) {
    await this.assertParticipant(conversationId, userId);
    const conv = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { participants: { include: { user: { select: peerSelect } } } },
    });
    if (!conv) throw new AppError('Conversation not found', 404);
    const { other, otherLastReadAt } = splitPeer(conv.participants, userId);
    return {
      id: conv.id,
      is_group: conv.is_group,
      other_user: other,
      other_last_read_at: otherLastReadAt,
      last_message_at: conv.last_message_at,
    };
  }

  static async getMessages(conversationId: string, userId: string, opts: { before?: string; limit?: number } = {}) {
    await this.assertParticipant(conversationId, userId);
    const limit = Math.min(opts.limit ?? 40, 100);

    const messages = await prisma.message.findMany({
      where: {
        conversation_id: conversationId,
        is_deleted: false,
        ...(opts.before ? { created_at: { lt: new Date(opts.before) } } : {}),
      },
      include: messageInclude,
      orderBy: { created_at: 'desc' },
      take: limit,
    });

    return messages.reverse().map((m) => this.shape(m));
  }

  static async sendMessage(
    conversationId: string,
    userId: string,
    data: { content?: string; message_type?: string }
  ) {
    await this.assertParticipant(conversationId, userId);
    const content = (data.content ?? '').trim();
    if (!content) throw new AppError('Message is empty', 400);

    // Media messages carry the uploaded file's URL as their content. "file" is
    // used for voice messages (audio recording URL).
    const type =
      data.message_type === 'image' || data.message_type === 'video' || data.message_type === 'file'
        ? data.message_type
        : 'text';
    if (type !== 'text' && !/^https?:\/\/\S+$/.test(content)) {
      throw new AppError('Media message must be a URL', 400);
    }

    const message = await prisma.message.create({
      data: {
        conversation_id: conversationId,
        sender_id: userId,
        content,
        message_type: type as any,
      },
      include: messageInclude,
    });

    await prisma.conversation.update({
      where: { id: conversationId },
      data: { last_message_at: new Date() },
    });

    const participants = await prisma.conversationParticipant.findMany({
      where: { conversation_id: conversationId },
      select: { user_id: true },
    });
    const shaped = this.shape(message);
    for (const p of participants) {
      if (p.user_id !== userId) {
        await prisma.messageStatus.upsert({
          where: { message_id_user_id: { message_id: message.id, user_id: p.user_id } },
          update: { status: 'sent' },
          create: { message_id: message.id, user_id: p.user_id, status: 'sent' },
        });
        emitToUser(p.user_id, 'message:new', shaped);
      }
    }

    return shaped;
  }

  static async markRead(conversationId: string, userId: string) {
    await this.assertParticipant(conversationId, userId);
    const lastReadAt = new Date();
    // Always recorded: it also drives the reader's own unread counts.
    await prisma.conversationParticipant.update({
      where: { conversation_id_user_id: { conversation_id: conversationId, user_id: userId } },
      data: { last_read_at: lastReadAt },
    });

    // Read receipt for the other participants, unless the reader turned them off.
    const reader = await prisma.user.findUnique({
      where: { id: userId },
      select: { allow_read_receipts: true },
    });
    if (reader?.allow_read_receipts) {
      const participants = await prisma.conversationParticipant.findMany({
        where: { conversation_id: conversationId, user_id: { not: userId } },
        select: { user_id: true },
      });
      for (const p of participants) {
        emitToUser(p.user_id, 'conversation:read', {
          conversationId,
          userId,
          last_read_at: lastReadAt,
        });
      }
    }
    return { success: true };
  }

  static async setArchived(conversationId: string, userId: string, archived: boolean) {
    await this.assertParticipant(conversationId, userId);
    await prisma.conversationParticipant.update({
      where: { conversation_id_user_id: { conversation_id: conversationId, user_id: userId } },
      data: { is_archived: archived },
    });
    return { success: true };
  }

  static shape(m: any) {
    return {
      id: m.id,
      conversation_id: m.conversation_id,
      sender: m.sender,
      sender_id: m.sender_id,
      content: m.content,
      message_type: m.message_type,
      call_meta: m.call_meta ?? null,
      story_id: m.story_id ?? null,
      story: m.story
        ? {
            id: m.story.id,
            user: m.story.user,
            content_url: m.story.content_url,
            content_type: m.story.content_type,
            thumbnail_url: m.story.thumbnail_url ?? null,
            bg_color: m.story.bg_color ?? null,
            caption: m.story.caption ?? null,
            expired: new Date(m.story.expires_at) < new Date(),
          }
        : null,
      created_at: m.created_at,
    };
  }

  /**
   * Instagram-style "mentioned you in their story" card in the DM between the
   * story author and the mentioned user.
   */
  static async sendStoryMention(senderId: string, recipientId: string, storyId: string) {
    const conversation = await getOrCreateDirectConversation(senderId, recipientId);
    const message = await prisma.message.create({
      data: {
        conversation_id: conversation.id,
        sender_id: senderId,
        story_id: storyId,
        content: null,
        message_type: 'story_mention',
      },
      include: messageInclude,
    });
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { last_message_at: new Date() },
    });
    await prisma.messageStatus.upsert({
      where: { message_id_user_id: { message_id: message.id, user_id: recipientId } },
      update: { status: 'sent' },
      create: { message_id: message.id, user_id: recipientId, status: 'sent' },
    });
    emitToUser(recipientId, 'message:new', this.shape(message));
    return message;
  }
}
