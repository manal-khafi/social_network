import express from 'express';
import { authMiddleware } from '../Middleware/authMiddlware';
import {
  validateStoryCreation,
  validateStoryComment,
  validateStoryMessage,
  validateStoryReaction,
  validateStoryShare,
} from '../Middleware/validation.middleware';
import { StoryController } from '../Controllers/story/story.controller';
import { StoryViewController } from '../Controllers/story/storyView.controller';
import { StoryLikeController } from '../Controllers/story/storyLike.controller';
import { StoryReactionController } from '../Controllers/story/storyReaction.controller';
import { StoryCommentController } from '../Controllers/story/storyComment.controller';
import { StoryMessageController } from '../Controllers/story/storyMessage.controller';
import { StoryShareController } from '../Controllers/story/storyShare.controller';
import { StoryMusicController } from '../Controllers/story/storyMusic.controller';

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(authMiddleware);

// Recherche de musique (avant les routes /:id)
router.get('/music/search', StoryMusicController.search);

// Routes principales pour les stories
router.post('/', validateStoryCreation, StoryController.createStory);
router.get('/', StoryController.getStoriesFeed);
router.get('/flat', StoryController.getVisibleStories);
router.get('/user/:userId', StoryController.getUserStories);
router.get('/:id', StoryController.getStoryById);
router.delete('/:id', StoryController.deleteStory);

// Vues
router.post('/:id/view', StoryViewController.viewStory);
router.get('/:id/views', StoryViewController.getStoryViews);

// Like binaire (double-tap coeur) — conservé pour compat
router.post('/:id/like', StoryLikeController.likeStory);
router.delete('/:id/like', StoryLikeController.unlikeStory);
router.get('/:id/likes', StoryLikeController.getStoryLikes);

// Réactions emoji (tray Instagram)
router.post('/:id/reactions', validateStoryReaction, StoryReactionController.react);
router.delete('/:id/reactions', StoryReactionController.removeReaction);
router.get('/:id/reactions', StoryReactionController.getStoryReactions);

// Commentaires
router.post('/:id/comments', validateStoryComment, StoryCommentController.commentStory);
router.get('/:id/comments', StoryCommentController.getStoryComments);
router.delete('/comments/:commentId', StoryCommentController.deleteComment);

// Réponse en message privé au créateur
router.post('/:id/message', validateStoryMessage, StoryMessageController.sendMessageToStory);
router.get('/:id/messages', StoryMessageController.getStoryMessages);

// Partage de la story en DM ("Envoyer à…")
router.post('/:id/share', validateStoryShare, StoryShareController.shareToUsers);

export default router;
