import type { Request, Response } from "express";
import { randomBytes } from "crypto";
import { logger } from "../../util/logger";
import { findOrCreateSocialUser, startSession, type SocialProfile } from "../../services/socialAccountService";

/**
 * Server-side Google sign-in (OAuth 2 authorization-code flow). Unlike a
 * Firebase popup, this is plain full-page navigation, so it works in every
 * mobile browser.
 *
 *   GET /api/authentication/google           -> redirect to Google
 *       (?reactivate=1: the owner of a deactivated account chose to reactivate it)
 *   GET /api/authentication/google/callback  -> session, then back to the app
 *
 * Both URLs are opened through the frontend's own domain (its /api/* rewrite),
 * so the refresh-token cookie set by the callback is first-party for the app.
 * The access token comes back in the URL fragment (#token=...), which browsers
 * never send to servers or put in Referer headers.
 */

const STATE_COOKIE = "oauth_state";
const STATE_TTL_MS = 10 * 60 * 1000;

const frontendUrl = () => (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/+$/, "");

/** Public base URL of the API as the browser sees it (the app's /api rewrite). */
const publicApiBase = () => (process.env.OAUTH_REDIRECT_BASE_URL || `${frontendUrl()}/api`).replace(/\/+$/, "");

/** Public URL Google sends the user back to (where /api is reachable). */
const callbackUrl = () => `${publicApiBase()}/authentication/google/callback`;

/** Whether this request reached us through the public API domain (directly or via the rewrite). */
const onPublicHost = (req: Request) => {
  const publicHost = new URL(publicApiBase()).host.toLowerCase();
  const forwarded = req.get("x-forwarded-host")?.split(",")[0]?.trim().toLowerCase();
  return forwarded === publicHost || req.get("host")?.toLowerCase() === publicHost;
};

const credentials = () => ({ id: process.env.GOOGLE_CLIENT_ID, secret: process.env.GOOGLE_CLIENT_SECRET });

const stateCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const, // sent on Google's top-level redirect back
  maxAge: STATE_TTL_MS,
  path: "/",
});

/** Back to the app with an error the login screen can show. */
const failRedirect = (res: Response, code: string, extra: Record<string, string> = {}) =>
  res.redirect(`${frontendUrl()}/#${new URLSearchParams({ oauth_error: code, ...extra })}`);

export const googleStart = (req: Request, res: Response) => {
  const { id } = credentials();
  if (!id) return failRedirect(res, "not_configured");

  // The state cookie must live on the domain Google calls back to, or the
  // callback never sees it (invalid_state). If sign-in was started on another
  // host (e.g. the backend's own *.onrender.com URL), hop once to the public
  // domain first. "hop=1" marks the second pass: a rewrite proxy may pass the
  // backend's own Host header, so the host check alone could loop forever.
  if (!onPublicHost(req) && req.query.hop !== "1") {
    const next = new URL(`${publicApiBase()}/authentication/google`);
    next.searchParams.set("hop", "1");
    if (req.query.reactivate === "1") next.searchParams.set("reactivate", "1");
    return res.redirect(next.toString());
  }

  // CSRF protection: the callback must bring back the same random state,
  // which only the browser that started sign-in holds in its cookie.
  const state = randomBytes(24).toString("hex");
  const reactivate = req.query.reactivate === "1" ? ":reactivate" : "";
  res.cookie(STATE_COOKIE, `google:${state}${reactivate}`, stateCookieOptions());

  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", id);
  url.searchParams.set("redirect_uri", callbackUrl());
  url.searchParams.set("state", state);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("prompt", "select_account");
  return res.redirect(url.toString());
};

const fetchJson = async (url: string, init?: RequestInit) => {
  const r = await fetch(url, init);
  const body = (await r.json().catch(() => ({}))) as Record<string, any>;
  if (!r.ok) throw Object.assign(new Error(body?.error_description || body?.error?.message || `HTTP ${r.status}`), { body });
  return body;
};

const googleProfile = async (code: string): Promise<SocialProfile | null> => {
  const { id, secret } = credentials();
  const token = await fetchJson("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: id!,
      client_secret: secret!,
      redirect_uri: callbackUrl(),
      grant_type: "authorization_code",
    }),
  });
  const info = await fetchJson("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { Authorization: `Bearer ${token.access_token}` },
  });
  if (!info.email) return null;
  return {
    email: String(info.email).toLowerCase(),
    emailVerified: info.email_verified === true,
    name: info.name,
    picture: info.picture,
    provider: "google.com",
  };
};

export const googleCallback = async (req: Request, res: Response) => {
  const saved = req.cookies?.[STATE_COOKIE] as string | undefined;
  res.clearCookie(STATE_COOKIE, { ...stateCookieOptions(), maxAge: undefined });

  // The person said no on Google's consent screen.
  if (req.query.error) return failRedirect(res, "cancelled");

  const code = typeof req.query.code === "string" ? req.query.code : null;
  const state = typeof req.query.state === "string" ? req.query.state : null;
  if (!code || !state || !saved) return failRedirect(res, "invalid_state");
  const reactivate = saved === `google:${state}:reactivate`;
  if (!reactivate && saved !== `google:${state}`) return failRedirect(res, "invalid_state");

  const { id, secret } = credentials();
  if (!id || !secret) return failRedirect(res, "not_configured");

  try {
    const profile = await googleProfile(code);
    if (!profile) return failRedirect(res, "no_email");

    const result = await findOrCreateSocialUser(profile, { reactivate });
    if (result.status !== "ok") {
      // Deactivated: the login screen offers to sign in again with ?reactivate=1.
      return result.status === "deactivated"
        ? failRedirect(res, "account_deactivated", { provider: "google" })
        : failRedirect(res, result.status);
    }

    const accessToken = await startSession(res, result.user);
    const page = result.user.onboarding_done === false ? "/personalize" : "/home";
    return res.redirect(`${frontendUrl()}${page}#token=${encodeURIComponent(accessToken)}`);
  } catch (err) {
    logger.error({ err }, "Google sign-in failed");
    return failRedirect(res, "failed");
  }
};
