import { Router } from "express";
import { authMiddleware } from "../Middleware/authMiddlware";
import multer from "multer";
import {
  archiveConversation,
  createOrGetDirectConversation,
  deleteConversationForMe,
  getMessages,
  listConversations,
  markConversationRead,
  restoreConversationForMe,
  unarchiveConversation,
} from "../Controllers/Inbox/inboxController";
import { uploadInboxFile, uploadInboxImage, uploadVoiceMessage } from "../Controllers/Inbox/uploadController";

const router = Router();

const upload = multer({ storage: multer.memoryStorage() });

router.get("/conversations", authMiddleware, listConversations);
router.post("/conversations/direct", authMiddleware, createOrGetDirectConversation);
router.get("/conversations/:conversationId/messages", authMiddleware, getMessages);

// Media uploads (used by realtime inbox messages)
router.post("/uploads/audio", authMiddleware, upload.single("audio"), uploadVoiceMessage);
router.post("/uploads/image", authMiddleware, upload.single("image"), uploadInboxImage);
router.post("/uploads/file", authMiddleware, upload.single("file"), uploadInboxFile);

router.patch("/conversations/:conversationId/read", authMiddleware, markConversationRead);
router.patch("/conversations/:conversationId/archive", authMiddleware, archiveConversation);
router.patch("/conversations/:conversationId/unarchive", authMiddleware, unarchiveConversation);
router.delete("/conversations/:conversationId", authMiddleware, deleteConversationForMe);
router.patch("/conversations/:conversationId/restore", authMiddleware, restoreConversationForMe);

export default router;
