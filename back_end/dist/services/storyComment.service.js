"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StoryCommentService = void 0;
const prisma_1 = __importDefault(require("../util/prisma"));
const error_1 = require("../util/error");
const story_service_1 = require("./story.service");
const notificationService_1 = require("../services/notificationService");
class StoryCommentService {
    /**
     * Ajoute un commentaire à une story
     */
    static async commentStory(storyId, userId, content) {
        // Vérifier que la story existe et est visible
        const story = await story_service_1.StoryService.getStoryById(storyId, userId);
        // Créer le commentaire
        const comment = await prisma_1.default.storyComment.create({
            data: {
                story_id: storyId,
                user_id: userId,
                content: content.trim(),
            },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        display_name: true,
                        avatar_url: true,
                    },
                },
            },
        });
        // Créer une notification pour le créateur (si ce n'est pas lui-même)
        if (story.user_id !== userId) {
            await notificationService_1.NotificationService.createStoryCommentNotification(story.user_id, userId, storyId, comment.id);
        }
        return comment;
    }
    /**
     * Récupère les commentaires d'une story
     */
    static async getStoryComments(storyId) {
        const story = await prisma_1.default.story.findUnique({
            where: { id: storyId },
        });
        if (!story) {
            throw new error_1.AppError('Story non trouvée', 404);
        }
        const comments = await prisma_1.default.storyComment.findMany({
            where: {
                story_id: storyId,
                is_deleted: false,
            },
            include: {
                user: {
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
        return comments;
    }
    /**
     * Supprime un commentaire (seul l'auteur peut le faire)
     */
    static async deleteComment(commentId, userId) {
        const comment = await prisma_1.default.storyComment.findUnique({
            where: { id: commentId },
        });
        if (!comment) {
            throw new error_1.AppError('Commentaire non trouvé', 404);
        }
        if (comment.user_id !== userId) {
            throw new error_1.AppError('Vous n\'êtes pas autorisé à supprimer ce commentaire', 403);
        }
        await prisma_1.default.storyComment.update({
            where: { id: commentId },
            data: { is_deleted: true },
        });
        return { message: 'Commentaire supprimé avec succès' };
    }
}
exports.StoryCommentService = StoryCommentService;
