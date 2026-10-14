import type { Request, Response } from "express";
import { randomBytes } from "crypto";
import { logger } from "../../util/logger";
import { findOrCreateSocialUser, startSession, type SocialProfile } from "../../services/socialAccountService";

/**
 * Server-side Google / Facebook sign-in (OAuth 2 authorization-code flow).
 * Unlike Firebase popups, this is plain full-page navigation, so it works in
 * every mobile browser.
 *
 *   GET /api/authentication/:provider           -> redirect to the provider
 *       (?reactivate=1: the owner of a deactivated account chose to reactivate it)
 *   GET /api/authentication/:provider/callback  -> session, then back to the app
 *
 * Both URLs are opened through the frontend's own domain (its /api/* rewrite),
 * so the refresh-token cookie set by the callback is first-party for the app.
 * The access token comes back in the URL fragment (#token=...), which browsers
 * never send to servers or put in Referer headers.
 */

type Provider = "google" | "facebook";

const STATE_COOKIE = "oauth_state";
const STATE_TTL_MS = 10 * 60 * 1000;
const FACEBOOK_API = "https://graph.facebook.com/v19.0";

const frontendUrl = () => (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/+$/, "");

/** Public base URL the provider sends the user back to (where /api is reachable). */
const callbackUrl = (provider: Provider) => {
  const base = (process.env.OAUTH_REDIRECT_BASE_URL || `${frontendUrl()}/api`).replace(/\/+$/, "");
  return `${base}/authentication/${provider}/callback`;
};

const credentials = (provider: Provider) =>
  provider === "google"
    ? { id: process.env.GOOGLE_CLIENT_ID, secret: process.env.GOOGLE_CLIENT_SECRET }
    : { id: process.env.FACEBOOK_APP_ID, secret: process.env.FACEBOOK_APP_SECRET };

const stateCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const, // sent on the provider's top-level redirect back
  maxAge: STATE_TTL_MS,
  path: "/",
});

/** Back to the app with an error the login screen can show. */
const failRedirect = (res: Response, code: string, extra: Record<string, string> = {}) =>
  res.redirect(`${frontendUrl()}/#${new URLSearchParams({ oauth_error: code, ...extra })}`);

const isProvider = (p: string): p is Provider => p === "google" || p === "facebook";

export const oauthStart = (req: Request, res: Response) => {
  const provider = req.params.provider;
  if (!isProvider(provider)) return res.status(404).json({ message: "Unknown provider" });
  const { id } = credentials(provider);
  if (!id) return failRedirect(res, "not_configured");

  // CSRF protection: the callback must bring back the same random state.
  const state = randomBytes(24).toString("hex");
  const reactivate = req.query.reactivate === "1" ? ":reactivate" : "";
  res.cookie(STATE_COOKIE, `${provider}:${state}${reactivate}`, stateCookieOptions());

  const url =
    provider === "google"
      ? new URL("https://accounts.google.com/o/oauth2/v2/auth")
      : new URL("https://www.facebook.com/v19.0/dialog/oauth");
  url.searchParams.set("client_id", id);
  url.searchParams.set("redirect_uri", callbackUrl(provider));
  url.searchParams.set("state", state);
  url.searchParams.set("response_type", "code");
  if (provider === "google") {
    url.searchParams.set("scope", "openid email profile");
    url.searchParams.set("prompt", "select_account");
  } else {
    url.searchParams.set("scope", "email,public_profile");
  }
  return res.redirect(url.toString());
};

const fetchJson = async (url: string, init?: RequestInit) => {
  const r = await fetch(url, init);
  const body = (await r.json().catch(() => ({}))) as Record<string, any>;
  if (!r.ok) throw Object.assign(new Error(body?.error_description || body?.error?.message || `HTTP ${r.status}`), { body });
  return body;
};

const googleProfile = async (code: string): Promise<SocialProfile | null> => {
  const { id, secret } = credentials("google");
  const token = await fetchJson("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: id!,
      client_secret: secret!,
      redirect_uri: callbackUrl("google"),
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

const facebookProfile = async (code: string): Promise<SocialProfile | null> => {
  const { id, secret } = credentials("facebook");
  const tokenUrl = new URL(`${FACEBOOK_API}/oauth/access_token`);
  tokenUrl.searchParams.set("client_id", id!);
  tokenUrl.searchParams.set("client_secret", secret!);
  tokenUrl.searchParams.set("redirect_uri", callbackUrl("facebook"));
  tokenUrl.searchParams.set("code", code);
  const token = await fetchJson(tokenUrl.toString());

  const meUrl = new URL(`${FACEBOOK_API}/me`);
  meUrl.searchParams.set("fields", "id,name,email,picture.type(large)");
  meUrl.searchParams.set("access_token", token.access_token);
  const me = await fetchJson(meUrl.toString());
  if (!me.email) return null; // no email shared (declined, or phone-only account)
  return {
    email: String(me.email).toLowerCase(),
    // The Graph API only returns an address the person has confirmed with Facebook.
    emailVerified: true,
    name: me.name,
    picture: me.picture?.data?.url ?? null,
    provider: "facebook.com",
  };
};

export const oauthCallback = async (req: Request, res: Response) => {
  const provider = req.params.provider;
  if (!isProvider(provider)) return res.status(404).json({ message: "Unknown provider" });

  const saved = req.cookies?.[STATE_COOKIE] as string | undefined;
  res.clearCookie(STATE_COOKIE, { ...stateCookieOptions(), maxAge: undefined });

  // The person said no on the provider's consent screen.
  if (req.query.error) return failRedirect(res, "cancelled");

  const code = typeof req.query.code === "string" ? req.query.code : null;
  const state = typeof req.query.state === "string" ? req.query.state : null;
  if (!code || !state || !saved) return failRedirect(res, "invalid_state");
  const reactivate = saved === `${provider}:${state}:reactivate`;
  if (!reactivate && saved !== `${provider}:${state}`) return failRedirect(res, "invalid_state");

  const { id, secret } = credentials(provider);
  if (!id || !secret) return failRedirect(res, "not_configured");

  try {
    const profile = provider === "google" ? await googleProfile(code) : await facebookProfile(code);
    if (!profile) return failRedirect(res, "no_email");

    const result = await findOrCreateSocialUser(profile, { reactivate });
    if (result.status !== "ok") {
      // Deactivated: the login screen offers to sign in again with ?reactivate=1.
      return result.status === "deactivated"
        ? failRedirect(res, "account_deactivated", { provider })
        : failRedirect(res, result.status);
    }

    const accessToken = await startSession(res, result.user);
    const page = result.user.onboarding_done === false ? "/personalize" : "/home";
    return res.redirect(`${frontendUrl()}${page}#token=${encodeURIComponent(accessToken)}`);
  } catch (err) {
    logger.error({ err, provider }, "OAuth sign-in failed");
    return failRedirect(res, "failed");
  }
};
