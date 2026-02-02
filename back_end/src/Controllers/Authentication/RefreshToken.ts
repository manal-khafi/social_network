import { Request, Response } from "express";
import { verifyRefreshToken, generateAccessToken } from "../../util/jwt";
import prisma from "../../config/prismaClient";

export const refreshToken = async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ message: "Refresh token manquant" });
  }

  try {
    const decoded = verifyRefreshToken(refreshToken) as {
      id: string;
      token_version: number;
    };

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
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

    if (!user || user.token_version !== decoded.token_version) {
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
      onboarding_done: user.onboarding_done,
    });

    res.status(200).json({ accessToken: newAccessToken });
  } catch (error) {
    return res.status(401).json({ message: "Invalid refresh token" });
  }
};
