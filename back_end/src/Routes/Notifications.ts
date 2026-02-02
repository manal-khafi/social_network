import { Router } from "express";
import { authMiddleware } from "../Middleware/authMiddlware";
import {
  listNotifications,
  getUnreadNotificationsCount,
  markAllNotificationsRead,
  markNotificationRead,
} from "../Controllers/Notifications/notificationsController";

const router = Router();

router.get("/", authMiddleware, listNotifications);
router.get("/unread-count", authMiddleware, getUnreadNotificationsCount);
router.patch("/:notificationId/read", authMiddleware, markNotificationRead);
router.patch("/read-all", authMiddleware, markAllNotificationsRead);

export default router;
