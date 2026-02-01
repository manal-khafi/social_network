"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const prisma_1 = __importDefault(require("../util/prisma"));
class NotificationService {
    /**
     * Crée une notification pour une vue de story
     */
    static async createStoryViewNotification(storyOwnerId, viewerId, storyId) {
        // Récupérer ou créer le type de notification pour les vues de stories
        let typeNotification = await prisma_1.default.typeNotification.findUnique({
            where: { code: 'story_view' },
        });
        if (!typeNotification) {
            typeNotification = await prisma_1.default.typeNotification.create({
                data: {
                    code: 'story_view',
                    name: 'Vue de story',
                    description: 'Quelqu\'un a vu votre story',
                },
            });
        }
        const viewer = await prisma_1.default.user.findUnique({
            where: { id: viewerId },
            select: { username: true, display_name: true },
        });
        await prisma_1.default.notification.create({
            data: {
                user_id: storyOwnerId,
                type_notification_id: typeNotification.id,
                source_id: storyId,
                source_type: 'story',
                title: 'Nouvelle vue sur votre story',
                message: `${viewer?.display_name || viewer?.username || 'Quelqu\'un'} a vu votre story`,
                metadata: {
                    viewer_id: viewerId,
                    story_id: storyId,
                },
            },
        });
    }
    /**
     * Crée une notification pour un like sur une story
     */
    static async createStoryLikeNotification(storyOwnerId, likerId, storyId) {
        let typeNotification = await prisma_1.default.typeNotification.findUnique({
            where: { code: 'story_like' },
        });
        if (!typeNotification) {
            typeNotification = await prisma_1.default.typeNotification.create({
                data: {
                    code: 'story_like',
                    name: 'Like sur story',
                    description: 'Quelqu\'un a aimé votre story',
                },
            });
        }
        const liker = await prisma_1.default.user.findUnique({
            where: { id: likerId },
            select: { username: true, display_name: true },
        });
        await prisma_1.default.notification.create({
            data: {
                user_id: storyOwnerId,
                type_notification_id: typeNotification.id,
                source_id: storyId,
                source_type: 'story',
                title: 'Nouveau like sur votre story',
                message: `${liker?.display_name || liker?.username || 'Quelqu\'un'} a aimé votre story`,
                metadata: {
                    liker_id: likerId,
                    story_id: storyId,
                },
            },
        });
    }
    /**
     * Crée une notification pour un commentaire sur une story
     */
    static async createStoryCommentNotification(storyOwnerId, commenterId, storyId, commentId) {
        let typeNotification = await prisma_1.default.typeNotification.findUnique({
            where: { code: 'story_comment' },
        });
        if (!typeNotification) {
            typeNotification = await prisma_1.default.typeNotification.create({
                data: {
                    code: 'story_comment',
                    name: 'Commentaire sur story',
                    description: 'Quelqu\'un a commenté votre story',
                },
            });
        }
        const commenter = await prisma_1.default.user.findUnique({
            where: { id: commenterId },
            select: { username: true, display_name: true },
        });
        await prisma_1.default.notification.create({
            data: {
                user_id: storyOwnerId,
                type_notification_id: typeNotification.id,
                source_id: storyId,
                source_type: 'story',
                title: 'Nouveau commentaire sur votre story',
                message: `${commenter?.display_name || commenter?.username || 'Quelqu\'un'} a commenté votre story`,
                metadata: {
                    commenter_id: commenterId,
                    story_id: storyId,
                    comment_id: commentId,
                },
            },
        });
    }
    /**
     * Crée une notification pour un message privé lié à une story
     */
    static async createStoryMessageNotification(storyOwnerId, senderId, storyId, messageId) {
        let typeNotification = await prisma_1.default.typeNotification.findUnique({
            where: { code: 'story_message' },
        });
        if (!typeNotification) {
            typeNotification = await prisma_1.default.typeNotification.create({
                data: {
                    code: 'story_message',
                    name: 'Message sur story',
                    description: 'Quelqu\'un vous a envoyé un message en réponse à votre story',
                },
            });
        }
        const sender = await prisma_1.default.user.findUnique({
            where: { id: senderId },
            select: { username: true, display_name: true },
        });
        await prisma_1.default.notification.create({
            data: {
                user_id: storyOwnerId,
                type_notification_id: typeNotification.id,
                source_id: storyId,
                source_type: 'story',
                title: 'Nouveau message sur votre story',
                message: `${sender?.display_name || sender?.username || 'Quelqu\'un'} vous a envoyé un message`,
                metadata: {
                    sender_id: senderId,
                    story_id: storyId,
                    message_id: messageId,
                },
            },
        });
    }
}
exports.NotificationService = NotificationService;
