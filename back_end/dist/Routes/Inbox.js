"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddlware_1 = require("../Middleware/authMiddlware");
const multer_1 = __importDefault(require("multer"));
const inboxController_1 = require("../Controllers/Inbox/inboxController");
const uploadController_1 = require("../Controllers/Inbox/uploadController");
const router = (0, express_1.Router)();
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
router.get("/conversations", authMiddlware_1.authMiddleware, inboxController_1.listConversations);
router.post("/conversations/direct", authMiddlware_1.authMiddleware, inboxController_1.createOrGetDirectConversation);
router.get("/conversations/:conversationId/messages", authMiddlware_1.authMiddleware, inboxController_1.getMessages);
// Media uploads (used by realtime inbox messages)
router.post("/uploads/audio", authMiddlware_1.authMiddleware, upload.single("audio"), uploadController_1.uploadVoiceMessage);
router.post("/uploads/image", authMiddlware_1.authMiddleware, upload.single("image"), uploadController_1.uploadInboxImage);
router.post("/uploads/file", authMiddlware_1.authMiddleware, upload.single("file"), uploadController_1.uploadInboxFile);
router.patch("/conversations/:conversationId/read", authMiddlware_1.authMiddleware, inboxController_1.markConversationRead);
router.patch("/conversations/:conversationId/archive", authMiddlware_1.authMiddleware, inboxController_1.archiveConversation);
router.patch("/conversations/:conversationId/unarchive", authMiddlware_1.authMiddleware, inboxController_1.unarchiveConversation);
router.delete("/conversations/:conversationId", authMiddlware_1.authMiddleware, inboxController_1.deleteConversationForMe);
router.patch("/conversations/:conversationId/restore", authMiddlware_1.authMiddleware, inboxController_1.restoreConversationForMe);
exports.default = router;
