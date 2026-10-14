import type { Request, Response } from "express";
import prisma from "../../config/prismaClient";
import bcrypt from "bcrypt";
import { clearRefreshTokenCookie, setRefreshTokenCookie } from "../../services/sessionService";
import { admin, bucket, isFirebaseConfigured } from "../../config/fireBase";
import { logger } from "../../util/logger";

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

/**
 * The deactivate / delete endpoints re-check who is asking. Email/password
 * accounts must enter their password; Google / Facebook accounts have none, so
 * their signed-in session is the proof (the UI makes them type a confirmation).
 */
const checkIdentity = async (
  userId: string,
  password: string | null | undefined
): Promise<
  | { ok: true; user: { id: string; email: string } }
  | { ok: false; status: number; message: string }
> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, password_hash: true },
  });
  if (!user) return { ok: false, status: 404, message: "User not found" };
  if (user.password_hash) {
    if (!password) return { ok: false, status: 400, message: "password is required" };
    if (!(await bcrypt.compare(password, user.password_hash))) {
      return { ok: false, status: 401, message: "Incorrect password" };
    }
  }
  return { ok: true, user: { id: user.id, email: user.email } };
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
    if (!reason || !reason.trim()) {
      return res.status(400).json({ success: false, message: "reason is required" });
    }

    const identity = await checkIdentity(userId, password);
    if (!identity.ok) {
      return res.status(identity.status).json({ success: false, message: identity.message });
    }

    // Hidden until the owner signs in again and chooses to reactivate.
    // Bumping token_version signs the account out on every device.
    await prisma.user.update({
      where: { id: userId },
      data: { is_active: false, token_version: { increment: 1 } },
    });
    clearRefreshTokenCookie(res);

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
    if (!reason || !reason.trim()) {
      return res.status(400).json({ success: false, message: "reason is required" });
    }

    const identity = await checkIdentity(userId, password);
    if (!identity.ok) {
      return res.status(identity.status).json({ success: false, message: identity.message });
    }

    // Every row the user owns (posts, comments, likes, stories, messages,
    // follows, memberships, notifications, communities they created...) goes
    // with it through ON DELETE CASCADE.
    await prisma.user.delete({ where: { id: userId } });
    clearRefreshTokenCookie(res);

    // Then what lives outside the database. Best effort: the account is
    // already gone, so a failure here must not turn into an error response.
    await deleteExternalData(identity.user);

    return res.status(200).json({ success: true, message: "Account deleted" });
  } catch (error) {
    console.error("deleteAccount error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/** The user's uploaded files and their Firebase Auth account (Google / Facebook sign-in). */
const deleteExternalData = async (user: { id: string; email: string }) => {
  if (bucket) {
    await bucket
      .deleteFiles({ prefix: `users/${user.id}/`, force: true })
      .catch((err) => logger.error({ err, userId: user.id }, "Could not delete the user's files"));
  }
  if (isFirebaseConfigured) {
    try {
      const fbUser = await admin.auth().getUserByEmail(user.email);
      await admin.auth().deleteUser(fbUser.uid);
    } catch (err) {
      if ((err as { code?: string })?.code !== "auth/user-not-found") {
        logger.error({ err, userId: user.id }, "Could not delete the Firebase account");
      }
    }
  }
};
