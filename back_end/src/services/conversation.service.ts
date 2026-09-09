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

const messageInclude = {
  sender: { select: userSelect },
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

  static async list(userId: string) {
    const parts = await prisma.conversationParticipant.findMany({
      where: { user_id: userId, is_archived: false },
      include: {
        conversation: {
          include: {
            participants: { include: { user: { select: userSelect } } },
          },
        },
      },
      orderBy: { conversation: { last_message_at: 'desc' } },
    });

    const result: Array<Record<string, unknown>> = [];
    for (const part of parts) {
      const conv = part.conversation;
      const other = conv.participants.find((p) => p.user_id !== userId)?.user ?? null;

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
        is_archived: part.is_archived,
      });
    }
    return result;
  }

  static async getOne(conversationId: string, userId: string) {
    await this.assertParticipant(conversationId, userId);
    const conv = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { participants: { include: { user: { select: userSelect } } } },
    });
    if (!conv) throw new AppError('Conversation not found', 404);
    const other = conv.participants.find((p) => p.user_id !== userId)?.user ?? null;
    return {
      id: conv.id,
      is_group: conv.is_group,
      other_user: other,
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

    const type = data.message_type === 'image' ? 'image' : 'text';

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
    await prisma.conversationParticipant.update({
      where: { conversation_id_user_id: { conversation_id: conversationId, user_id: userId } },
      data: { last_read_at: new Date() },
    });
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
      created_at: m.created_at,
    };
  }
}
