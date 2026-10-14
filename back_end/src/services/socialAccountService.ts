import type { Response } from "express";
import prisma from "../config/prismaClient";
import { generateAccessToken } from "../util/jwt";
import { setRefreshTokenCookie } from "./sessionService";

export interface SocialProfile {
  email: string;
  /** The provider confirmed the person owns this address. */
  emailVerified: boolean;
  name?: string | null;
  picture?: string | null;
  /** e.g. "google.com" (same values Firebase uses). */
  provider: string;
}

export interface SocialSignInOptions {
  /** The owner chose to reactivate a deactivated account by signing in. */
  reactivate?: boolean;
}

export type SocialAccountResult =
  | { status: "ok"; user: Awaited<ReturnType<typeof prisma.user.findUnique>> & {} }
  | { status: "account_exists_with_different_method" }
  | { status: "deactivated" };

/** A free username derived from the email (alice, alice4821, ...). */
const freeUsername = async (email: string) => {
  const base = (email.split("@")[0] || "user").replace(/[^A-Za-z0-9_.]/g, "").slice(0, 24) || "user";
  if (!(await prisma.user.findUnique({ where: { username: base }, select: { id: true } }))) return base;
  for (let i = 0; i < 5; i++) {
    const candidate = `${base}${Math.floor(1000 + Math.random() * 9000)}`;
    if (!(await prisma.user.findUnique({ where: { username: candidate }, select: { id: true } }))) return candidate;
  }
  return `${base}${Date.now()}`;
};

/**
 * Finds the account for a social sign-in by email, or creates it. An account
 * created another way (email/password, the other provider) is reused only when
 * the provider verified the email; otherwise anyone able to put someone else's
 * address on a social account could take that account over.
 */
export const findOrCreateSocialUser = async (
  profile: SocialProfile,
  { reactivate = false }: SocialSignInOptions = {}
): Promise<SocialAccountResult> => {
  let user = await prisma.user.findUnique({ where: { email: profile.email } });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: profile.email,
        username: await freeUsername(profile.email),
        display_name: profile.name || "",
        avatar_url: profile.picture || "",
        is_verified: true,
        provider: profile.provider,
        onboarding_done: true, // social sign-up skips the onboarding wizard
        token_version: 1, // brand-new account: start one above the default 0
      },
    });
    return { status: "ok", user };
  }

  const sameMethod = user.provider === profile.provider;
  if (!sameMethod && !profile.emailVerified) return { status: "account_exists_with_different_method" };
  if (!user.is_active && !reactivate) return { status: "deactivated" };

  // Remember the latest method; a verified provider email also confirms the
  // address of an email/password account that was never verified.
  if (!sameMethod || (!user.is_verified && profile.emailVerified) || !user.is_active) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        provider: profile.provider,
        ...(profile.emailVerified && { is_verified: true }),
        ...(!user.is_active && { is_active: true }),
      },
    });
  }
  return { status: "ok", user };
};

/** Issues the app session (access token + refresh cookie) for a signed-in user. */
export const startSession = async (
  res: Response,
  user: { id: string; email: string; username: string; avatar_url: string | null; onboarding_done: boolean; token_version: number }
) => {
  const withRole = await prisma.user.findUnique({
    where: { id: user.id },
    include: { role: { include: { rolePermissions: { include: { permission: true } } } } },
  });
  const permissions =
    withRole?.role?.rolePermissions.map((rp: { permission: { code: string } }) => rp.permission.code) || [];

  const accessToken = generateAccessToken({
    id: user.id,
    email: user.email,
    username: user.username,
    avatar_url: user.avatar_url ?? null,
    role: withRole?.role?.name,
    permissions,
    onboarding_done: user.onboarding_done,
  });
  setRefreshTokenCookie(res, user);
  return accessToken;
};
