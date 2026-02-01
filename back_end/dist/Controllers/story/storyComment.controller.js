"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StoryCommentController = void 0;
const storyComment_service_1 = require("../../services/storyComment.service");
const error_1 = require("../../util/error");
class StoryCommentController {
    /**
     * Ajoute un commentaire à une story
     * POST /stories/:id/comments
     */
    static async commentStory(req, res) {
        if (!req.user) {
            throw new error_1.AppError("Utilisateur non authentifié", 401);
        }
        if (typeof req.params.id !== 'string') {
            return res.status(400).json({ message: "Invalid ID" });
        }
        const { content } = req.body;
        const comment = await storyComment_service_1.StoryCommentService.commentStory(req.params.id, req.user.id, content);
        return res.status(201).json({
            success: true,
            message: "Commentaire ajouté avec succès",
            data: comment,
        });
    }
    /**
     * Récupère les commentaires d'une story
     * GET /stories/:id/comments
     */
    static async getStoryComments(req, res) {
        if (typeof req.params.id !== 'string') {
            return res.status(400).json({ message: "Invalid ID" });
        }
        const comments = await storyComment_service_1.StoryCommentService.getStoryComments(req.params.id);
        return res.status(200).json({
            success: true,
            data: comments,
        });
    }
    /**
     * Supprime un commentaire
     * DELETE /stories/comments/:commentId
     */
    static async deleteComment(req, res) {
        if (!req.user) {
            throw new error_1.AppError("Utilisateur non authentifié", 401);
        }
        if (typeof req.params.commentId !== 'string') {
            return res.status(400).json({ message: "Invalid ID" });
        }
        const result = await storyComment_service_1.StoryCommentService.deleteComment(req.params.commentId, req.user.id);
        return res.status(200).json({
            success: true,
            ...result,
        });
    }
}
exports.StoryCommentController = StoryCommentController;
