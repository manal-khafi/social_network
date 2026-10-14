import type { User as FirebaseUser } from "firebase/auth";
import { loginWithGoogle, loginWithFacebook, getSocialRedirectResult } from "../../../config/firebaseConfig";
import { socialLoginBackend } from "../../../utils/api";
import type { User } from "../../../features/auth/authSlice";

/**
 * What to tell the user when the Google / Facebook popup fails. null means the
 * user simply closed the popup: nothing to report.
 */
export const socialAuthErrorMessage = (
  error: unknown,
  t: (key: string) => string,
  fallback: string
): string | null => {
  const e = error as { code?: string; message?: string; response?: { data?: { message?: string } } };
  switch (e?.code) {
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
    case "auth/user-cancelled":
      return null;
    case "auth/popup-blocked":
      return t("auth.popupBlocked");
    case "auth/operation-not-supported-in-this-environment":
    case "auth/web-storage-unsupported":
      return t("auth.socialUnsupportedBrowser");
    default:
      return e?.response?.data?.message || e?.message || fallback;
  }
};

export interface SocialAuthResult {
  success: boolean;
  token: string;
  user: User | null;
  message?: string;
  redirectTo?: string;
}

/** Exchanges a Firebase user for the app's own session (backend JWT). */
const exchangeWithBackend = async (
  user: FirebaseUser,
  provider: "google" | "facebook"
): Promise<SocialAuthResult> => {
  const idToken = await user.getIdToken();
  const backendResponse = await socialLoginBackend(idToken, provider);
  if (!backendResponse.token) throw new Error("Backend did not return JWT token");
  return { success: true, token: backendResponse.token, user: backendResponse.user };
};

/**
 * Starts Google / Facebook sign-in. Resolves with the session on desktop
 * (popup), or with null on mobile, where the browser is redirected to the
 * provider and the sign-in completes on return (see completeSocialRedirect).
 */
export const handleSocialAuth = async (
  provider: "google" | "facebook"
): Promise<SocialAuthResult | null> => {
  try {
    const user = provider === "google" ? await loginWithGoogle() : await loginWithFacebook();
    if (!user) return null; // redirecting
    return await exchangeWithBackend(user, provider);
  } catch (error: any) {
    console.error("Social auth failed:", error);
    throw error;
  }
};

let redirectResult: Promise<SocialAuthResult | null> | null = null;

/**
 * Finishes a redirect sign-in (mobile) once the provider sends the user back.
 * Null when no redirect sign-in is pending. Memoised: the result can only be
 * read once, and React may run the caller's effect twice in development.
 */
export const completeSocialRedirect = (): Promise<SocialAuthResult | null> => {
  redirectResult ??= (async () => {
    const result = await getSocialRedirectResult();
    if (!result?.user) return null;
    const provider = result.providerId === "facebook.com" ? "facebook" : "google";
    return exchangeWithBackend(result.user, provider);
  })();
  return redirectResult;
};
