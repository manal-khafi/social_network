import { Response, NextFunction } from "express";
import {
  verifyAccessToken,
  verifyRefreshToken,
  generateAccessToken,
} from "../util/jwt";
import { PrismaClient } from "@prisma/client";
import { AuthRequest } from "../types/AuthRequest";

const prisma = new PrismaClient();

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Token manquant" });
    }

    const token = authHeader.split(" ")[1];

    try {
      const decoded = verifyAccessToken(token) as {
        id: string;
        email: string;
        role?: string;
        permissions: string[];
      };

      req.user = decoded;
      return next();
    } catch (err: unknown) {
      const error = err as { name?: string; message?: string };

      // If token is expired, try to refresh it
      if (error.name === "TokenExpiredError") {
        const refreshToken =
          req.cookies?.refreshToken || req.headers["x-refresh-token"];

        if (!refreshToken) {
          return res
            .status(401)
            .json({ message: "Token expiré et refresh token manquant" });
        }

        try {
          const decodedRefresh = verifyRefreshToken(refreshToken as string) as {
            id: string;
          };

          const user = await prisma.user.findUnique({
            where: { id: decodedRefresh.id },
            include: {
              role: {
                include: {
                  rolePermissions: {
                    include: {
                      permission: true,
                    },
                  },
                },
              },
            },
          });

          if (!user) {
            return res.status(401).json({ message: "Utilisateur introuvable" });
          }

          const permissions =
            user.role?.rolePermissions.map(
              (p: { permission: { name: string } }) => p.permission.name
            ) || [];

          const newAccessToken = generateAccessToken({
            id: user.id,
            email: user.email,
            role: user.role?.name,
            permissions,
          });

          res.setHeader("x-access-token", newAccessToken);

          req.user = {
            id: user.id,
            email: user.email,
            role: user.role?.name,
            permissions,
          };

          return next();
        } catch (refreshError) {
          console.error("Refresh token verification failed:", refreshError);
          return res.status(401).json({ message: "Refresh token invalide" });
        }
      } else {
        // Token is invalid (wrong secret, malformed, etc.)
        console.error(
          "Token verification failed:",
          error.message || error.name
        );
        return res.status(401).json({
          message: "Token invalide",
          error:
            error.name === "JsonWebTokenError"
              ? "Invalid token format"
              : error.message,
        });
      }
    }
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized" });
  }
};
