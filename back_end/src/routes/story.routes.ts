import express from 'express';
import { authMiddleware } from '../Middleware/authMiddlware';
import {
  validateStoryCreation,
  validateStoryComment,
  validateStoryMessage,
} from '../Middleware/validation.middleware';
import { StoryController } from '../Controllers/story/story.controller';
import { StoryViewController } from '../Controllers/story/storyView.controller';
import { StoryLikeController } from '../Controllers/story/storyLike.controller';
import { StoryCommentController } from '../Controllers/story/storyComment.controller';
import { StoryMessageController } from '../Controllers/story/storyMessage.controller';

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(authMiddleware);

// Routes principales pour les stories
router.post('/', validateStoryCreation, StoryController.createStory);
router.get('/', StoryController.getVisibleStories);
router.get('/user/:userId', StoryController.getUserStories);
router.get('/:id', StoryController.getStoryById);
router.delete('/:id', StoryController.deleteStory);

// Routes pour les vues
router.post('/:id/view', StoryViewController.viewStory);
router.get('/:id/views', StoryViewController.getStoryViews);

// Routes pour les likes
router.post('/:id/like', StoryLikeController.likeStory);
router.delete('/:id/like', StoryLikeController.unlikeStory);
router.get('/:id/likes', StoryLikeController.getStoryLikes);

// Routes pour les commentaires
router.post('/:id/comments', validateStoryComment, StoryCommentController.commentStory);
router.get('/:id/comments', StoryCommentController.getStoryComments);
router.delete('/comments/:commentId', StoryCommentController.deleteComment);

// Routes pour les messages privés
router.post('/:id/message', validateStoryMessage, StoryMessageController.sendMessageToStory);
router.get('/:id/messages', StoryMessageController.getStoryMessages);

export default router;

