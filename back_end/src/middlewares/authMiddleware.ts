import { Request, Response, NextFunction } from "express";
import {verifyAccessToken,verifyRefreshToken,generateAccessToken,} from "../utils/authJwt";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
  };
}

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer "))
      return res.status(401).json({ message: "Token manquant" });

    const token = authHeader.split(" ")[1];

    try {
      const decoded = verifyAccessToken(token) as {
        id: number;
        email: string;
        role?: string;
        permissions: string[];
      };
      req.user = decoded;
      return next();
    } catch (err: any) {
      if (err.name !== "TokenExpiredError")
        return res.status(401).json({ message: "Token invalide" });

      const refreshToken =
        req.cookies?.refreshToken || req.headers["x-refresh-token"];
      if (!refreshToken)
        return res.status(401).json({ message: "Refresh token manquant" });

      const decodedRefresh = verifyRefreshToken(refreshToken) as { id: number };

      const user = await prisma.user.findUnique({
        where: { id: decodedRefresh.id },
      });

      const newAccessToken = generateAccessToken({
        id: user.id,
        email: user.email,
      });

      res.setHeader("x-access-token", newAccessToken);
      req.user = {
        id: user.id,
        email: user.email, 
      };

      next();
    }
  } catch (error) {
    res.status(401).json({ message: "Unauthorized", error });
  }
};
