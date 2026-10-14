import type { Request, Response, NextFunction, RequestHandler } from "express";

/**
 * Allows the request only when the authenticated user's platform role
 * (User.role -> Role.name, carried in req.user.role) is one of `roles`.
 * Comparison is case-insensitive. Must run after authMiddleware.
 */
export const requireRole = (...roles: string[]): RequestHandler => {
  const allowed = roles.map((r) => r.toLowerCase());

  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, message: "Not authenticated" });
    }

    const role = req.user.role?.toLowerCase();
    if (!role || !allowed.includes(role)) {
      return res.status(403).json({ success: false, message: "Forbidden: admin access required" });
    }

    return next();
  };
};

/** Platform administrators (moderation: reports, etc.). */
export const requireAdmin = requireRole("ADMIN", "SUPER_ADMIN");
