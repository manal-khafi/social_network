"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StoryLikeController = void 0;
const storyLike_service_1 = require("../../services/storyLike.service");
const error_1 = require("../../util/error");
class StoryLikeController {
    /**
     * Ajoute un like à une story
     * POST /stories/:id/like
     */
    static async likeStory(req, res) {
        if (!req.user) {
            throw new error_1.AppError("Utilisateur non authentifié", 401);
        }
        if (typeof req.params.id !== 'string') {
            return res.status(400).json({ message: "Invalid ID" });
        }
        const like = await storyLike_service_1.StoryLikeService.likeStory(req.params.id, req.user.id);
        return res.status(201).json({
            success: true,
            message: "Story aimée avec succès",
            data: like,
        });
    }
    /**
     * Retire un like d'une story
     * DELETE /stories/:id/like
     */
    static async unlikeStory(req, res) {
        if (!req.user) {
            throw new error_1.AppError("Utilisateur non authentifié", 401);
        }
        if (typeof req.params.id !== 'string') {
            return res.status(400).json({ message: "Invalid ID" });
        }
        const result = await storyLike_service_1.StoryLikeService.unlikeStory(req.params.id, req.user.id);
        return res.status(200).json({
            success: true,
            ...result,
        });
    }
    /**
     * Récupère les likes d'une story
     * GET /stories/:id/likes
     */
    static async getStoryLikes(req, res) {
        if (typeof req.params.id !== 'string') {
            return res.status(400).json({ message: "Invalid ID" });
        }
        const likes = await storyLike_service_1.StoryLikeService.getStoryLikes(req.params.id);
        return res.status(200).json({
            success: true,
            data: likes,
        });
    }
}
exports.StoryLikeController = StoryLikeController;
