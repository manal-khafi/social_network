import type { Request, Response } from "express";
import prisma from "../../config/prismaClient";

export const Me = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated",
      });
    }

    const headerToken = res.getHeader("x-access-token") as string | undefined;
    const authHeader = req.headers.authorization;
    const bearerToken =
      authHeader && authHeader.startsWith("Bearer ")
        ? authHeader.split(" ")[1]
        : undefined;
    const token = headerToken || bearerToken || null;

    // req.user is the access-token payload, i.e. a snapshot taken when the
    // token was issued (up to 15 minutes ago). Profile fields that the user can
    // change are read from the database so a new avatar shows up at once.
    const current = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { username: true, avatar_url: true, display_name: true, onboarding_done: true },
    });
    if (!current) {
      return res.status(401).json({ success: false, message: "Not authenticated" });
    }

    return res.status(200).json({
      success: true,
      user: {
        id: req.user.id,
        email: req.user.email,
        username: current.username ?? "",
        avatar_url: current.avatar_url ?? null,
        display_name: current.display_name ?? null,
        role: req.user.role,
        permissions: req.user.permissions ?? [],
        onboarding_done: current.onboarding_done
      },
      token,
    });
  } catch (error) {
    console.error("Me endpoint error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
