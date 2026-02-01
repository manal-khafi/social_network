"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StoryMessageController = void 0;
const storyMessage_service_1 = require("../../services/storyMessage.service");
const error_1 = require("../../util/error");
class StoryMessageController {
    /**
     * Envoie un message privé en réponse à une story
     * POST /stories/:id/message
     */
    static async sendMessageToStory(req, res) {
        if (!req.user) {
            throw new error_1.AppError("Utilisateur non authentifié", 401);
        }
        if (typeof req.params.id !== 'string') {
            return res.status(400).json({ message: "Invalid ID" });
        }
        const { recipient_id, content } = req.body;
        const message = await storyMessage_service_1.StoryMessageService.sendMessageToStory(req.params.id, req.user.id, recipient_id, content);
        return res.status(201).json({
            success: true,
            message: "Message envoyé avec succès",
            data: message,
        });
    }
    /**
     * Récupère les messages liés à une story (créateur uniquement)
     * GET /stories/:id/messages
     */
    static async getStoryMessages(req, res) {
        if (!req.user) {
            throw new error_1.AppError("Utilisateur non authentifié", 401);
        }
        if (typeof req.params.id !== 'string') {
            return res.status(400).json({ message: "Invalid ID" });
        }
        const messages = await storyMessage_service_1.StoryMessageService.getStoryMessages(req.params.id, req.user.id);
        return res.status(200).json({
            success: true,
            data: messages,
        });
    }
}
exports.StoryMessageController = StoryMessageController;
