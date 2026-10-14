import type { Response } from "express";
import type { Prisma } from "@prisma/client";
import prisma from "../config/prismaClient";
import { generateAccessToken, generateRefreshToken } from "../util/jwt";

// Relations needed to build the access-token payload for a user.
export const sessionUserInclude = {
  role: {
    include: {
      rolePermissions: {
        include: { permission: true },
      },
    },
  },
} satisfies Prisma.UserInclude;

export type SessionUser = Prisma.UserGetPayload<{ include: typeof sessionUserInclude }>;

const refreshCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
});

/** Signs a refresh token for the user's current token_version and sets the cookie. */
export const setRefreshTokenCookie = (
  res: Response,
  user: { id: string; token_version: number }
) => {
  const refreshToken = generateRefreshToken({
    id: user.id,
    token_version: user.token_version,
  });

  res.cookie("refreshToken", refreshToken, {
    ...refreshCookieOptions(),
    maxAge: 24 * 60 * 60 * 1000,
  });
};

export const clearRefreshTokenCookie = (res: Response) => {
  res.clearCookie("refreshToken", refreshCookieOptions());
};

/**
 * Final step of a successful sign-in: issues the access token, sets the
 * refresh-token cookie and records last_login. Call it only once every
 * required factor (password, and TOTP when 2FA is enabled) has been verified.
 */
export const issueLoginSession = async (res: Response, user: SessionUser) => {
  const permissions =
    user.role?.rolePermissions.map((rp: { permission: { code: string } }) => rp.permission.code) || [];

  const tokenPayload = {
    id: user.id,
    email: user.email,
    username: user.username,
    avatar_url: user.avatar_url ?? null,
    role: user.role?.name,
    permissions,
  };

  const token = generateAccessToken(tokenPayload);
  setRefreshTokenCookie(res, user);

  await prisma.user.update({
    where: { id: user.id },
    data: { last_login: new Date() },
  });

  return {
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role?.name,
      permissions,
      onboarding_done: user.onboarding_done,
    },
  };
};
