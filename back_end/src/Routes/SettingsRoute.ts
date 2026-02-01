import { Router } from "express";
import * as settingsController from "../Controllers/settings/settingsControllers";
import { authMiddleware } from "../Middleware/authMiddlware";

const router = Router();

// Toutes les routes nécessitent une authentification
router.use(authMiddleware);

/* ACCOUNT ROUTES */
router.get("/account", settingsController.getAccount);
router.patch("/account", settingsController.updateAccount);
router.post("/account/password", settingsController.changePassword);
router.patch("/account/toggle-active", settingsController.toggleActive);
router.delete("/account", settingsController.deleteAccount);

/* PRIVACY ROUTES */
router.get("/privacy", settingsController.getPrivacySettings);
router.patch("/privacy", settingsController.updatePrivacySettings);
router.patch("/privacy/toggle-private", settingsController.togglePrivate);

/* NOTIFICATIONS ROUTES */
router.get("/notifications", settingsController.getNotifications);
router.get("/notifications/settings",settingsController.getNotificationSettings);
router.patch("/notifications/settings",settingsController.updateNotificationSettings);
router.patch("/notifications/mark-read", settingsController.markAllNotificationsRead);

/* APPEARANCE ROUTES */
router.get("/appearance", settingsController.getAppearanceSettings);
router.patch("/appearance", settingsController.updateAppearanceSettings);

/* GLOBAL SETTINGS */
router.get("/", settingsController.getAllSettings);

export default router;
