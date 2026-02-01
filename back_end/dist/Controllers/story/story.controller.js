"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StoryController = void 0;
const story_service_1 = require("../../services/story.service");
const error_1 = require("../../util/error");
class StoryController {
    static async createStory(req, res) {
        if (!req.user)
            throw new error_1.AppError("Utilisateur non authentifié", 401);
        const story = await story_service_1.StoryService.createStory(req.user.id, req.body);
        return res.status(201).json({
            success: true,
            message: "Story créée avec succès",
            data: story,
        });
    }
    static async getVisibleStories(req, res) {
        if (!req.user)
            throw new error_1.AppError("Utilisateur non authentifié", 401);
        const stories = await story_service_1.StoryService.getVisibleStories(req.user.id);
        return res.status(200).json({ success: true, data: stories });
    }
    static async getStoryById(req, res) {
        if (!req.user)
            throw new error_1.AppError("Utilisateur non authentifié", 401);
        if (typeof req.params.id !== 'string') {
            return res.status(400).json({ message: "Invalid ID" });
        }
        const story = await story_service_1.StoryService.getStoryById(req.params.id, req.user.id);
        return res.status(200).json({ success: true, data: story });
    }
    static async getUserStories(req, res) {
        if (!req.user)
            throw new error_1.AppError("Utilisateur non authentifié", 401);
        if (typeof req.params.userId !== 'string') {
            return res.status(400).json({ message: "Invalid user ID" });
        }
        const stories = await story_service_1.StoryService.getUserStories(req.params.userId, req.user.id);
        return res.status(200).json({ success: true, data: stories });
    }
    static async deleteStory(req, res) {
        if (!req.user)
            throw new error_1.AppError("Utilisateur non authentifié", 401);
        if (typeof req.params.id !== 'string') {
            return res.status(400).json({ message: "Invalid ID" });
        }
        const result = await story_service_1.StoryService.deleteStory(req.params.id, req.user.id);
        return res.status(200).json({ success: true, ...result });
    }
}
exports.StoryController = StoryController;
