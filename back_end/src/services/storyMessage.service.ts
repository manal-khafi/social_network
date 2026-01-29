import prisma from '../utils/prisma';
import { AppError } from '../utils/errors';
import { StoryService } from './story.service';
import { NotificationService } from './notification.service';

export class StoryMessageService {
  /**
   * Envoie un message privé en réponse à une story
   */
  static async sendMessageToStory(
    storyId: string,
    senderId: string,
    recipientId: string,
    content: string
  ) {
    // Vérifier que la story existe et est visible
    const story = await StoryService.getStoryById(storyId, senderId);

    // Vérifier que le destinataire est bien le créateur de la story
    if (story.user_id !== recipientId) {
      throw new AppError('Le destinataire doit être le créateur de la story', 400);
    }

    // Vérifier qu'on ne s'envoie pas un message à soi-même
    if (senderId === recipientId) {
      throw new AppError('Vous ne pouvez pas vous envoyer un message', 400);
    }

    // Trouver une conversation existante entre les deux utilisateurs
    // Rechercher toutes les conversations non-groupes
    const conversations = await prisma.conversation.findMany({
      where: {
        is_group: false,
      },
      include: {
        participants: true,
      },
    });

    // Trouver la conversation qui a exactement ces deux participants
    let conversation = conversations.find((conv) => {
      const participantIds = conv.participants.map((p) => p.user_id);
      return (
        participantIds.length === 2 &&
        participantIds.includes(senderId) &&
        participantIds.includes(recipientId)
      );
    });

    // Si aucune conversation n'existe, en créer une
    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          is_group: false,
          participants: {
            create: [
              { user_id: senderId },
              { user_id: recipientId },
            ],
          },
        },
        include: {
          participants: true,
        },
      });
    } else {
      // Vérifier que les deux utilisateurs sont bien dans la conversation
      const participantIds = conversation.participants.map((p) => p.user_id);
      if (!participantIds.includes(senderId) || !participantIds.includes(recipientId)) {
        // Ajouter les participants manquants
        if (!participantIds.includes(senderId)) {
          await prisma.conversationParticipant.create({
            data: {
              conversation_id: conversation.id,
              user_id: senderId,
            },
          });
        }
        if (!participantIds.includes(recipientId)) {
          await prisma.conversationParticipant.create({
            data: {
              conversation_id: conversation.id,
              user_id: recipientId,
            },
          });
        }
      }
    }

    // Créer le message lié à la story
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
          select: {
            id: true,
            username: true,
            display_name: true,
            avatar_url: true,
          },
        },
      },
    });

    // Créer les statuts de message pour le destinataire
    await prisma.messageStatus.create({
      data: {
        message_id: message.id,
        user_id: recipientId,
        status: 'sent',
      },
    });

    // Créer une notification pour le créateur
    await NotificationService.createStoryMessageNotification(
      recipientId,
      senderId,
      storyId,
      message.id
    );

    return message;
  }

  /**
   * Récupère les messages liés à une story (pour le créateur uniquement)
   */
  static async getStoryMessages(storyId: string, userId: string) {
    const story = await prisma.story.findUnique({
      where: { id: storyId },
    });

    if (!story) {
      throw new AppError('Story non trouvée', 404);
    }

    if (story.user_id !== userId) {
      throw new AppError('Vous n\'êtes pas autorisé à voir les messages de cette story', 403);
    }

    const messages = await prisma.message.findMany({
      where: { story_id: storyId },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            display_name: true,
            avatar_url: true,
          },
        },
      },
      orderBy: {
        created_at: 'asc',
      },
    });

    return messages;
  }
}

