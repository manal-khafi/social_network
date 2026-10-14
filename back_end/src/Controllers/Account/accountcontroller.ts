import type { Request, Response } from "express";
import prisma from "../../config/prismaClient";
import bcrypt from "bcrypt";
import { setRefreshTokenCookie } from "../../services/sessionService";

export const changePassword = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Not authenticated" });
    }

    const { currentPassword, newPassword } = req.body as {
      currentPassword?: string | null;
      newPassword?: string | null;
    };

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: "currentPassword and newPassword are required" });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, password_hash: true },
    });

    if (!user || !user.password_hash) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const ok = await bcrypt.compare(currentPassword, user.password_hash);
    if (!ok) {
      return res.status(401).json({ success: false, message: "Incorrect current password" });
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    // Bumping token_version invalidates every refresh token issued before the
    // change (all other devices). This session gets a fresh one so the user
    // who just changed their password stays signed in here.
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { password_hash: hashed, token_version: { increment: 1 } },
      select: { id: true, token_version: true },
    });
    setRefreshTokenCookie(res, updated);

    return res.status(200).json({ success: true, message: "Password updated" });
  } catch (error) {
    console.error("changePassword error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const deactivateAccount = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Not authenticated" });
    }

    const { password, reason } = req.body as {
      password?: string | null;
      reason?: string | null;
    };

    if (!password) {
      return res.status(400).json({ success: false, message: "password is required" });
    }
    if (!reason || !reason.trim()) {
      return res.status(400).json({ success: false, message: "reason is required" });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, password_hash: true },
    });

    if (!user || !user.password_hash) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ success: false, message: "Incorrect password" });
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        is_active: false, 
      },
    });

    return res.status(200).json({ success: true, message: "Account deactivated" });
  } catch (error) {
    console.error("deactivateAccount error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const deleteAccount = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Not authenticated" });
    }

    const { password, reason } = req.body as {
      password?: string | null;
      reason?: string | null;
    };

    if (!password) {
      return res.status(400).json({ success: false, message: "password is required" });
    }
    if (!reason || !reason.trim()) {
      return res.status(400).json({ success: false, message: "reason is required" });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, password_hash: true },
    });

    if (!user || !user.password_hash) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ success: false, message: "Incorrect password" });
    }
    await prisma.user.delete({ where: { id: userId } });

    return res.status(200).json({ success: true, message: "Account deleted" });
  } catch (error) {
    console.error("deleteAccount error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};
