"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StoryViewController = void 0;
const storyView_service_1 = require("../../services/storyView.service");
const error_1 = require("../../util/error");
class StoryViewController {
    static async viewStory(req, res) {
        if (!req.user)
            throw new error_1.AppError("Utilisateur non authentifié", 401);
        if (typeof req.params.id !== 'string') {
            return res.status(400).json({ message: "Invalid ID" });
        }
        const view = await storyView_service_1.StoryViewService.viewStory(req.params.id, req.user.id);
        return res.status(200).json({
            success: true,
            message: "Vue enregistrée avec succès",
            data: view,
        });
    }
    static async getStoryViews(req, res) {
        if (!req.user)
            throw new error_1.AppError("Utilisateur non authentifié", 401);
        if (typeof req.params.id !== 'string') {
            return res.status(400).json({ message: "Invalid ID" });
        }
        const views = await storyView_service_1.StoryViewService.getStoryViews(req.params.id, req.user.id);
        return res.status(200).json({
            success: true,
            data: views,
        });
    }
}
exports.StoryViewController = StoryViewController;
