import type { Request, Response } from "express";
import { StoryMessageService } from "../../services/storyMessage.service";
import { AppError } from "../../util/error";

export class StoryMessageController {
  /**
   * Envoie un message privé en réponse à une story
   * POST /stories/:id/message
   */
  static async sendMessageToStory(req: Request, res: Response) {
    if (!req.user) {
      throw new AppError("Utilisateur non authentifié", 401);
    }

    const { recipient_id, content } = req.body;

    const message = await StoryMessageService.sendMessageToStory(
      (req.params.id as string),
      req.user.id,
      recipient_id,
      content
    );

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
  static async getStoryMessages(req: Request, res: Response) {
    if (!req.user) {
      throw new AppError("Utilisateur non authentifié", 401);
    }

    const messages = await StoryMessageService.getStoryMessages(
      (req.params.id as string),
      req.user.id
    );

    return res.status(200).json({
      success: true,
      data: messages,
    });
  }
}
