import { Request, Response } from "express";
import * as settingsService from "../../Service/settingsService";

/* ACCOUNT CONTROLLERS */
export const getAccount = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const account = await settingsService.getAccount(userId);
    res.json(account);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateAccount = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const account = await settingsService.updateAccount(userId, req.body);
    res.json(account);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const changePassword = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const result = await settingsService.changePassword(
      userId,
      currentPassword,
      newPassword,
    );
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const toggleActive = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const result = await settingsService.toggleActive(userId);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteAccount = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { password, reason } = req.body;

    if (!password || !reason) {
      return res
        .status(400)
        .json({ message: "Password and reason are required" });
    }

    const result = await settingsService.deleteAccount(
      userId,
      password,
      reason,
    );
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

/* PRIVACY CONTROLLERS */
export const getPrivacySettings = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const settings = await settingsService.getPrivacySettings(userId);
    res.json(settings);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updatePrivacySettings = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const settings = await settingsService.updatePrivacySettings(
      userId,
      req.body,
    );
    res.json(settings);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const togglePrivate = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const result = await settingsService.togglePrivate(userId);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

/* NOTIFICATION CONTROLLERS */
export const getNotifications = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const notifications = await settingsService.getNotifications(
      userId,
      page,
      limit,
    );
    res.json(notifications);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getNotificationSettings = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const settings = await settingsService.getNotificationSettings(userId);
    res.json(settings);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateNotificationSettings = async (
  req: Request,
  res: Response,
) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const settings = await settingsService.updateNotificationSettings(
      userId,
      req.body,
    );
    res.json(settings);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const markAllNotificationsRead = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const result = await settingsService.markAllNotificationsRead(userId);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

/* APPEARANCE CONTROLLERS */
export const getAppearanceSettings = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const settings = await settingsService.getAppearanceSettings(userId);
    res.json(settings);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateAppearanceSettings = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const settings = await settingsService.updateAppearanceSettings(
      userId,
      req.body,
    );
    res.json(settings);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

/* GLOBAL SETTINGS */
export const getAllSettings = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const settings = await settingsService.getAllSettings(userId);
    res.json(settings);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
