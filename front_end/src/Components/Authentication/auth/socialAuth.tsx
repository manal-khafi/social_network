import api from "../../../api/axios";

export type SocialProvider = "google" | "facebook";

/**
 * Google / Facebook sign-in: a full-page redirect to the backend, which runs
 * the OAuth flow and sends the browser back to the app with the session
 * (see consumeOAuthRedirect). No popups, so it works in every mobile browser.
 */
export const startSocialAuth = (provider: SocialProvider, { reactivate = false } = {}) => {
  const base = (api.defaults.baseURL || "/api").replace(/\/+$/, "");
  window.location.assign(`${base}/authentication/${provider}${reactivate ? "?reactivate=1" : ""}`);
};

export interface OAuthError {
  code: string;
  /** Set with account_deactivated: the provider to sign in again with to reactivate. */
  provider: SocialProvider | null;
}

let pendingOAuthError: OAuthError | null = null;

/**
 * Reads what the backend's OAuth callback put in the URL fragment
 * (#token=... on success, #oauth_error=... on failure) and removes it from
 * the address bar so the token is not left in history. Call once, before the
 * app renders.
 */
export const consumeOAuthRedirect = (): string | null => {
  const hash = window.location.hash.replace(/^#/, "");
  if (!hash) return null;
  const params = new URLSearchParams(hash);
  const token = params.get("token");
  const error = params.get("oauth_error");
  if (!token && !error) return null;

  window.history.replaceState(window.history.state, "", window.location.pathname + window.location.search);
  if (error) {
    const provider = params.get("provider");
    pendingOAuthError = {
      code: error,
      provider: provider === "google" || provider === "facebook" ? provider : null,
    };
  }
  return token;
};

/** The OAuth failure from the last redirect, without consuming it. */
export const peekOAuthError = () => pendingOAuthError;

/** The OAuth failure from the last redirect, once (for the login screen). */
export const takeOAuthError = () => {
  const error = pendingOAuthError;
  pendingOAuthError = null;
  return error;
};

/** What to tell the user about an OAuth failure code. null = nothing to report. */
export const oauthErrorMessage = (code: string, t: (key: string) => string): string | null => {
  switch (code) {
    case "cancelled":
      return null;
    case "account_deactivated": // the login screen offers to reactivate instead
      return null;
    case "account_exists_with_different_method":
      return t("auth.accountExistsWithDifferentCredential");
    case "no_email":
      return t("auth.oauthNoEmail");
    case "not_configured":
      return t("auth.oauthNotConfigured");
    default:
      return t("auth.socialLoginFailed");
  }
};
