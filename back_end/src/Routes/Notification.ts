import { Router } from "express";
import {
  listNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
} from "../Controllers/Notifications/notificationController";
import {
  getNotificationSettings,
  updateNotificationSettings,
} from "../Controllers/Settings/notificationSettings";

// Mounted at /api/notifications behind authMiddleware (see index.ts).
const notificationRoutes = Router();

notificationRoutes.get("/", listNotifications);
// Fixed paths before the "/:id" ones.
notificationRoutes.get("/unread-count", getUnreadCount);
notificationRoutes.patch("/read-all", markAllNotificationsRead);
notificationRoutes.get("/settings", getNotificationSettings);
notificationRoutes.patch("/settings", updateNotificationSettings);
notificationRoutes.patch("/:id/read", markNotificationRead);
notificationRoutes.delete("/:id", deleteNotification);

export default notificationRoutes;
