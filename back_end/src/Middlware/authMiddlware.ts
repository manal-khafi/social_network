import { Response, NextFunction } from "express";
import {
  verifyAccessToken,
  verifyRefreshToken,
  generateAccessToken
} from "../util/jwt";
import { PrismaClient } from "@prisma/client";
import { AuthRequest } from "../types/AuthRequest";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    console.log("[AUTH] Authorization header:", authHeader ? "Present" : "Missing");

    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Token manquant" });
    }

    const token = authHeader.split(" ")[1];
    console.log("[AUTH] Token length:", token.length);
    console.log("[AUTH] Token starts with:", token.substring(0, 50));

    // Check if it's a Firebase token (RS256) or our HS256 token
    const tokenHeader = JSON.parse(Buffer.from(token.split('.')[0], 'base64').toString());
    const isFirebaseToken = tokenHeader.alg === "RS256";
    console.log("[AUTH] Token type:", isFirebaseToken ? "Firebase/OAuth (RS256)" : "Local (HS256)");

    try {
      let decoded: any;
      
      if (isFirebaseToken) {
        // For Firebase tokens, decode without verification (signature verification happens on Firebase side)
        decoded = jwt.decode(token) as {
          sub?: string;
          email?: string;
          email_verified?: boolean;
          name?: string;
        };
        
        if (!decoded) {
          return res.status(401).json({ message: "Token invalide" });
        }

        // Find or create user from Firebase token
        let user = await prisma.user.findFirst({
          where: { email: decoded.email }
        });

        if (!user) {
          // Create user from Firebase data
          user = await prisma.user.create({
            data: {
              id: decoded.sub || `firebase_${decoded.email}`,
              email: decoded.email || "",
              username: decoded.email?.split("@")[0] || "user",
              display_name: decoded.name || decoded.email?.split("@")[0] || "User",
              is_verified: decoded.email_verified || true,
              provider: "google"
            }
          });
        }

        req.user = {
          id: user.id,
          email: user.email,
          role: undefined,
          permissions: []
        };
        return next();
      } else {
        // Local token - verify with our secret
        decoded = verifyAccessToken(token) as {
          id: string;
          email: string;
          role?: string;
          permissions: string[];
        };
        console.log("[AUTH] Token verified successfully");

        req.user = {
          id: decoded.id,
          email: decoded.email,
          role: decoded.role,
          permissions: decoded.permissions
        };
        return next();
      }

    } catch (err: any) {
      console.log("[AUTH] Token verification failed:", err.message);
      if (err.name !== "TokenExpiredError") {
        return res.status(401).json({ message: "Token invalide" });
      }

      const refreshToken =
        req.cookies?.refreshToken ||
        req.headers["x-refresh-token"];

      if (!refreshToken) {
        return res.status(401).json({ message: "Refresh token manquant" });
      }

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
                  permission: true
                }
              }
            }
          }
        }
      });

      if (!user) {
        return res.status(401).json({ message: "Utilisateur introuvable" });
      }

      const permissions =
        user.role?.rolePermissions.map((p: any) => p.permission.name) || [];

      const newAccessToken = generateAccessToken({
        id: user.id,
        email: user.email,
        role: user.role?.name,
        permissions
      });

      res.setHeader("x-access-token", newAccessToken);

      req.user = {
        id: user.id,
        email: user.email,
        role: user.role?.name,
        permissions
      };

      next();
    }
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized" });
  }
};