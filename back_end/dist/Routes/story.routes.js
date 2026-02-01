"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddlware_1 = require("../Middleware/authMiddlware");
const validation_middleware_1 = require("../Middleware/validation.middleware");
const story_controller_1 = require("../Controllers/story/story.controller");
const storyView_controller_1 = require("../Controllers/story/storyView.controller");
const storyLike_controller_1 = require("../Controllers/story/storyLike.controller");
const storyComment_controller_1 = require("../Controllers/story/storyComment.controller");
const storyMessage_controller_1 = require("../Controllers/story/storyMessage.controller");
const router = express_1.default.Router();
// Toutes les routes nécessitent une authentification
router.use(authMiddlware_1.authMiddleware);
// Routes principales pour les stories
router.post('/', validation_middleware_1.validateStoryCreation, story_controller_1.StoryController.createStory);
router.get('/', story_controller_1.StoryController.getVisibleStories);
router.get('/user/:userId', story_controller_1.StoryController.getUserStories);
router.get('/:id', story_controller_1.StoryController.getStoryById);
router.delete('/:id', story_controller_1.StoryController.deleteStory);
// Routes pour les vues
router.post('/:id/view', storyView_controller_1.StoryViewController.viewStory);
router.get('/:id/views', storyView_controller_1.StoryViewController.getStoryViews);
// Routes pour les likes
router.post('/:id/like', storyLike_controller_1.StoryLikeController.likeStory);
router.delete('/:id/like', storyLike_controller_1.StoryLikeController.unlikeStory);
router.get('/:id/likes', storyLike_controller_1.StoryLikeController.getStoryLikes);
// Routes pour les commentaires
router.post('/:id/comments', validation_middleware_1.validateStoryComment, storyComment_controller_1.StoryCommentController.commentStory);
router.get('/:id/comments', storyComment_controller_1.StoryCommentController.getStoryComments);
router.delete('/comments/:commentId', storyComment_controller_1.StoryCommentController.deleteComment);
// Routes pour les messages privés
router.post('/:id/message', validation_middleware_1.validateStoryMessage, storyMessage_controller_1.StoryMessageController.sendMessageToStory);
router.get('/:id/messages', storyMessage_controller_1.StoryMessageController.getStoryMessages);
exports.default = router;
