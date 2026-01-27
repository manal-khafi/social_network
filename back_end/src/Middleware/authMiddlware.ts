import {
  verifyAccessToken,
  verifyRefreshToken,
  generateAccessToken
} from "../util/jwt";
import prisma from "../config/prismaClient";
import type { Request, Response, NextFunction } from "express";


export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const hasBearer = authHeader?.startsWith("Bearer ");

    // ✅ If no access token, try refresh token instead of failing immediately
    if (!hasBearer) {
      const refreshToken = req.cookies?.refreshToken || req.headers["x-refresh-token"];

      if (!refreshToken) {
        return res.status(401).json({ message: "Token manquant" });
      }

      const decodedRefresh = verifyRefreshToken(refreshToken as string) as {
        id: string;
        token_version: number;
      };

      const user = await prisma.user.findUnique({
        where: { id: decodedRefresh.id },
        include: {
          role: {
            include: {
              rolePermissions: { include: { permission: true } },
            },
          },
        },
      });

      if (!user || user.token_version !== decodedRefresh.token_version) {
        return res.status(401).json({ message: "Invalid refresh token" });
      }

      const permissions =
        user.role?.rolePermissions.map((p) => p.permission.name) || [];

      const newAccessToken = generateAccessToken({
        id: user.id,
        email: user.email,
        username: user.username,
        avatar_url: user.avatar_url ?? null,
        role: user.role?.name,
        permissions,
      });

      res.setHeader("x-access-token", newAccessToken);

      req.user = {
        id: user.id,
        email: user.email,
        username: user.username,
        avatar_url: user.avatar_url ?? null,
        role: user.role?.name,
        permissions,
        onboarding_done: user.onboarding_done
      };

      return next();
    }

    // ✅ Normal path: access token exists
    const token = authHeader!.split(" ")[1];

    try {
      const decoded = verifyAccessToken(token) as {
        id: string;
        email: string;
        username?: string;
        avatar_url?: string | null;
        role?: string;
        permissions: string[];
        onboarding_done: boolean;
      };

      req.user = decoded;
      return next();
    } catch (err: unknown) {
      // expired -> try refresh (your existing logic)
      if (err instanceof Error && err.name !== "TokenExpiredError") {
        return res.status(401).json({ message: "Token invalide" });
      }

      const refreshToken = req.cookies?.refreshToken || req.headers["x-refresh-token"];
      if (!refreshToken) {
        return res.status(401).json({ message: "Refresh token manquant" });
      }

      const decodedRefresh = verifyRefreshToken(refreshToken as string) as {
        id: string;
        token_version: number;
      };

      const user = await prisma.user.findUnique({
        where: { id: decodedRefresh.id },
        include: {
          role: {
            include: {
              rolePermissions: { include: { permission: true } },
            },
          },
        },
      });

      if (!user || user.token_version !== decodedRefresh.token_version) {
        return res.status(401).json({ message: "Invalid refresh token" });
      }

      const permissions =
        user.role?.rolePermissions.map((p) => p.permission.name) || [];

      const newAccessToken = generateAccessToken({
        id: user.id,
        email: user.email,
        username: user.username,
        avatar_url: user.avatar_url ?? null,
        role: user.role?.name,
        permissions,
      });

      res.setHeader("x-access-token", newAccessToken);

      req.user = {
        id: user.id,
        email: user.email,
        username: user.username,
        avatar_url: user.avatar_url ?? null,
        role: user.role?.name,
        permissions,
        onboarding_done: user.onboarding_done
      };

      return next();
    }
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized" });
  }
};
