import type { Request, Response } from "express";
import { ConversationService } from "../services/conversation.service";
import { AppError } from "../util/error";

const uid = (req: Request) => {
  if (!req.user) throw new AppError("Not authenticated", 401);
  return req.user.id;
};

export class ConversationController {
  /** GET /conversations?archived=true */
  static async list(req: Request, res: Response) {
    const data = await ConversationService.list(uid(req), {
      archived: req.query.archived === "true",
    });
    return res.json({ success: true, data });
  }

  /** POST /conversations  { user_id } -> open/create a DM */
  static async openDirect(req: Request, res: Response) {
    const otherUserId = req.body?.user_id;
    if (typeof otherUserId !== "string") throw new AppError("user_id requis", 400);
    const data = await ConversationService.openDirect(uid(req), otherUserId);
    return res.status(201).json({ success: true, data });
  }

  /** GET /conversations/:id */
  static async getOne(req: Request, res: Response) {
    const data = await ConversationService.getOne(req.params.id as string, uid(req));
    return res.json({ success: true, data });
  }

  /** GET /conversations/:id/messages?before=&limit= */
  static async getMessages(req: Request, res: Response) {
    const data = await ConversationService.getMessages(req.params.id as string, uid(req), {
      before: typeof req.query.before === "string" ? req.query.before : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
    });
    return res.json({ success: true, data });
  }

  /** POST /conversations/:id/messages  { content, message_type? } */
  static async sendMessage(req: Request, res: Response) {
    const data = await ConversationService.sendMessage(req.params.id as string, uid(req), req.body ?? {});
    return res.status(201).json({ success: true, data });
  }

  /** POST /conversations/:id/read */
  static async markRead(req: Request, res: Response) {
    await ConversationService.markRead(req.params.id as string, uid(req));
    return res.json({ success: true });
  }

  /** POST /conversations/:id/archive  { archived } */
  static async setArchived(req: Request, res: Response) {
    const archived = req.body?.archived !== false;
    await ConversationService.setArchived(req.params.id as string, uid(req), archived);
    return res.json({ success: true });
  }
}
