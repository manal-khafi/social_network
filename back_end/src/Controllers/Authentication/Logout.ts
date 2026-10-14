import { Request, Response } from "express";
import prisma from "../../config/prismaClient";
import { verifyAccessToken, verifyRefreshToken } from "../../util/jwt";
import { clearRefreshTokenCookie } from "../../services/sessionService";

/**
 * Works out who is logging out. The route has no authMiddleware (logout must
 * succeed even with an expired access token), so read the tokens directly:
 * the refresh token first, then the Bearer access token.
 */
const resolveSession = (req: Request): { id: string; token_version?: number } | null => {
  const refreshToken = req.cookies?.refreshToken || req.headers["x-refresh-token"];
  if (typeof refreshToken === "string" && refreshToken) {
    try {
      const decoded = verifyRefreshToken(refreshToken) as { id?: string; token_version?: number };
      if (decoded?.id) return { id: decoded.id, token_version: decoded.token_version };
    } catch {
      // invalid / expired refresh token: fall through to the access token
    }
  }

  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    try {
      const decoded = verifyAccessToken(authHeader.split(" ")[1]) as { id?: string };
      if (decoded?.id) return { id: decoded.id };
    } catch {
      // invalid / expired access token
    }
  }

  return null;
};

export const Logout = async (req: Request, res: Response) => {
  try {
    // Revoke server-side: bumping token_version invalidates every refresh token
    // issued so far for this user. A refresh token that is already stale (its
    // version no longer matches) does not bump it again.
    const session = resolveSession(req);
    if (session) {
      await prisma.user.updateMany({
        where: {
          id: session.id,
          ...(session.token_version !== undefined && { token_version: session.token_version }),
        },
        data: { token_version: { increment: 1 } },
      });
    }

    clearRefreshTokenCookie(res);

    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during logout",
    });
  }
};
