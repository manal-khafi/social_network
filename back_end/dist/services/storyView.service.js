"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StoryViewService = void 0;
const prisma_1 = __importDefault(require("../util/prisma"));
const error_1 = require("../util/error");
const story_service_1 = require("./story.service");
const notificationService_1 = require("../services/notificationService");
class StoryViewService {
    /**
     * Enregistre une vue sur une story (unique par utilisateur)
     */
    static async viewStory(storyId, viewerId) {
        // Vérifier que la story existe et est visible
        const story = await story_service_1.StoryService.getStoryById(storyId, viewerId);
        // Vérifier si l'utilisateur a déjà vu cette story
        const existingView = await prisma_1.default.storyView.findUnique({
            where: {
                story_id_viewer_id: {
                    story_id: storyId,
                    viewer_id: viewerId,
                },
            },
        });
        if (existingView) {
            return { message: 'Story déjà vue', view: existingView };
        }
        // Créer la vue
        const view = await prisma_1.default.storyView.create({
            data: {
                story_id: storyId,
                viewer_id: viewerId,
            },
        });
        // Créer une notification pour le créateur (si ce n'est pas lui-même)
        if (story.user_id !== viewerId) {
            await notificationService_1.NotificationService.createStoryViewNotification(story.user_id, viewerId, storyId);
        }
        return view;
    }
    /**
     * Récupère les vues d'une story (pour le créateur uniquement)
     */
    static async getStoryViews(storyId, userId) {
        const story = await prisma_1.default.story.findUnique({
            where: { id: storyId },
        });
        if (!story) {
            throw new error_1.AppError('Story non trouvée', 404);
        }
        if (story.user_id !== userId) {
            throw new error_1.AppError('Vous n\'êtes pas autorisé à voir les vues de cette story', 403);
        }
        const views = await prisma_1.default.storyView.findMany({
            where: { story_id: storyId },
            include: {
                viewer: {
                    select: {
                        id: true,
                        username: true,
                        display_name: true,
                        avatar_url: true,
                    },
                },
            },
            orderBy: {
                viewed_at: 'desc',
            },
        });
        return views;
    }
}
exports.StoryViewService = StoryViewService;
