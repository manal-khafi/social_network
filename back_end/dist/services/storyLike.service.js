"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StoryLikeService = void 0;
const prisma_1 = __importDefault(require("../util/prisma"));
const error_1 = require("../util/error");
const story_service_1 = require("./story.service");
const notificationService_1 = require("../services/notificationService");
class StoryLikeService {
    /**
     * Ajoute un like à une story (unique par utilisateur)
     */
    static async likeStory(storyId, userId) {
        // Vérifier que la story existe et est visible
        const story = await story_service_1.StoryService.getStoryById(storyId, userId);
        // Vérifier si l'utilisateur a déjà liké cette story
        const existingLike = await prisma_1.default.storyLike.findUnique({
            where: {
                user_id_story_id: {
                    user_id: userId,
                    story_id: storyId,
                },
            },
        });
        if (existingLike) {
            throw new error_1.AppError('Vous avez déjà aimé cette story', 400);
        }
        // Créer le like
        const like = await prisma_1.default.storyLike.create({
            data: {
                user_id: userId,
                story_id: storyId,
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
            await notificationService_1.NotificationService.createStoryLikeNotification(story.user_id, userId, storyId);
        }
        return like;
    }
    /**
     * Retire un like d'une story
     */
    static async unlikeStory(storyId, userId) {
        const like = await prisma_1.default.storyLike.findUnique({
            where: {
                user_id_story_id: {
                    user_id: userId,
                    story_id: storyId,
                },
            },
        });
        if (!like) {
            throw new error_1.AppError('Vous n\'avez pas aimé cette story', 400);
        }
        await prisma_1.default.storyLike.delete({
            where: {
                user_id_story_id: {
                    user_id: userId,
                    story_id: storyId,
                },
            },
        });
        return { message: 'Like retiré avec succès' };
    }
    /**
     * Récupère les likes d'une story
     */
    static async getStoryLikes(storyId) {
        const story = await prisma_1.default.story.findUnique({
            where: { id: storyId },
        });
        if (!story) {
            throw new error_1.AppError('Story non trouvée', 404);
        }
        const likes = await prisma_1.default.storyLike.findMany({
            where: { story_id: storyId },
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
                created_at: 'desc',
            },
        });
        return likes;
    }
}
exports.StoryLikeService = StoryLikeService;
