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

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: { permission: true },
            },
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const permissions =
      user.role?.rolePermissions.map((rp: any) => rp.permission.code) || [];

    const headerToken = res.getHeader("x-access-token") as string | undefined;
    const authHeader = req.headers.authorization;
    const bearerToken =
      authHeader && authHeader.startsWith("Bearer ")
        ? authHeader.split(" ")[1]
        : undefined;
    const token = headerToken || bearerToken || null;

    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.setHeader("Surrogate-Control", "no-store");

    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        username: user.username ?? "",
        avatar_url: user.avatar_url ?? null,
        role: user.role?.name,
        permissions,
        onboarding_done: user.onboarding_done
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
