import { verifyAccessToken } from "../util/jwt";
import type { Request, Response, NextFunction } from "express";

/**
 * Middleware to authenticate requests using an access token.
 * It verifies the access token from the Authorization header.
 * If the token is valid, it attaches the user payload to `req.user`.
 * If the token is missing, invalid, or expired, it sends a 401 Unauthorized response.
 *
 * This middleware does NOT handle token refreshing.
 * The client is expected to handle 401 errors and use a refresh token to obtain a new access token.
 */
export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized: No token provided" });
  }

  const token = authHeader.split(" ")[1];

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

    // Attach user information to the request object
    req.user = decoded;
    next();
  } catch (error: any) {
    if (error.name === "TokenExpiredError") {
      return res
        .status(401)
        .json({ message: "Unauthorized: Token has expired" });
    }
    return res
      .status(401)
      .json({ message: "Unauthorized: Invalid token" });
  }
};
