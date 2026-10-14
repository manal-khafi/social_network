import type { User as FirebaseUser } from "firebase/auth";
import { loginWithGoogle, loginWithFacebook } from "../../../config/firebaseConfig";
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
  const e = error as { code?: string; message?: string; response?: { data?: { message?: string; code?: string } } };
  switch (e?.code) {
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
    case "auth/user-cancelled":
      return null;
    case "auth/popup-blocked":
      return t("auth.popupBlocked");
    // Firebase: the email is already used by another sign-in method.
    case "auth/account-exists-with-different-credential":
      return t("auth.accountExistsWithDifferentCredential");
    case "auth/operation-not-supported-in-this-environment":
    case "auth/web-storage-unsupported":
      return t("auth.socialUnsupportedBrowser");
    default:
      // Same situation, refused by our backend (unverified provider email).
      if ((e?.response?.data as { code?: string } | undefined)?.code === "account_exists_with_different_method") {
        return t("auth.accountExistsWithDifferentCredential");
      }
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

/** Google / Facebook sign-in (popup), then the app's own session. */
export const handleSocialAuth = async (provider: "google" | "facebook"): Promise<SocialAuthResult> => {
  try {
    const user = provider === "google" ? await loginWithGoogle() : await loginWithFacebook();
    if (!user) throw new Error("No user returned from Firebase");
    return await exchangeWithBackend(user, provider);
  } catch (error: any) {
    console.error("Social auth failed:", error);
    throw error;
  }
};
