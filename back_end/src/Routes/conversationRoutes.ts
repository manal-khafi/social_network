import { Router } from "express";
import { authMiddleware } from "../Middleware/authMiddlware";
import { ConversationController } from "../Controllers/conversation.controller";

const router = Router();
router.use(authMiddleware);

router.get("/", ConversationController.list);
router.post("/", ConversationController.openDirect);
router.get("/:id", ConversationController.getOne);
router.get("/:id/messages", ConversationController.getMessages);
router.post("/:id/messages", ConversationController.sendMessage);
router.post("/:id/read", ConversationController.markRead);
router.post("/:id/archive", ConversationController.setArchived);

export default router;
