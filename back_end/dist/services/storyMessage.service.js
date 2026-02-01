"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StoryMessageService = void 0;
const prisma_1 = __importDefault(require("../util/prisma"));
const error_1 = require("../util/error");
const story_service_1 = require("./story.service");
const notificationService_1 = require("../services/notificationService");
class StoryMessageService {
    /**
     * Envoie un message privé en réponse à une story
     */
    static async sendMessageToStory(storyId, senderId, recipientId, content) {
        // Vérifier que la story existe et est visible
        const story = await story_service_1.StoryService.getStoryById(storyId, senderId);
        // Vérifier que le destinataire est bien le créateur de la story
        if (story.user_id !== recipientId) {
            throw new error_1.AppError('Le destinataire doit être le créateur de la story', 400);
        }
        // Vérifier qu'on ne s'envoie pas un message à soi-même
        if (senderId === recipientId) {
            throw new error_1.AppError('Vous ne pouvez pas vous envoyer un message', 400);
        }
        // Trouver une conversation existante entre les deux utilisateurs
        // Rechercher toutes les conversations non-groupes
        const conversations = await prisma_1.default.conversation.findMany({
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
            return (participantIds.length === 2 &&
                participantIds.includes(senderId) &&
                participantIds.includes(recipientId));
        });
        // Si aucune conversation n'existe, en créer une
        if (!conversation) {
            conversation = await prisma_1.default.conversation.create({
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
        }
        else {
            // Vérifier que les deux utilisateurs sont bien dans la conversation
            const participantIds = conversation.participants.map((p) => p.user_id);
            if (!participantIds.includes(senderId) || !participantIds.includes(recipientId)) {
                // Ajouter les participants manquants
                if (!participantIds.includes(senderId)) {
                    await prisma_1.default.conversationParticipant.create({
                        data: {
                            conversation_id: conversation.id,
                            user_id: senderId,
                        },
                    });
                }
                if (!participantIds.includes(recipientId)) {
                    await prisma_1.default.conversationParticipant.create({
                        data: {
                            conversation_id: conversation.id,
                            user_id: recipientId,
                        },
                    });
                }
            }
        }
        // Créer le message lié à la story
        const message = await prisma_1.default.message.create({
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
        await prisma_1.default.messageStatus.create({
            data: {
                message_id: message.id,
                user_id: recipientId,
                status: 'sent',
            },
        });
        // Créer une notification pour le créateur
        await notificationService_1.NotificationService.createStoryMessageNotification(recipientId, senderId, storyId, message.id);
        return message;
    }
    /**
     * Récupère les messages liés à une story (pour le créateur uniquement)
     */
    static async getStoryMessages(storyId, userId) {
        const story = await prisma_1.default.story.findUnique({
            where: { id: storyId },
        });
        if (!story) {
            throw new error_1.AppError('Story non trouvée', 404);
        }
        if (story.user_id !== userId) {
            throw new error_1.AppError('Vous n\'êtes pas autorisé à voir les messages de cette story', 403);
        }
        const messages = await prisma_1.default.message.findMany({
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
exports.StoryMessageService = StoryMessageService;
