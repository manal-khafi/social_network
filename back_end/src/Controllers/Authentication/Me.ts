import type { Request, Response } from "express";

export const Me = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated",
      });
    }

    return res.status(200).json({
      success: true,
      user: {
        id: req.user.id,
        email: req.user.email,
        username: req.user.username ?? "",
        role: req.user.role,
        permissions: req.user.permissions ?? [],
        onboarding_done: req.user.onboarding_done
      },
    });
  } catch (error) {
    console.error("Me endpoint error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
