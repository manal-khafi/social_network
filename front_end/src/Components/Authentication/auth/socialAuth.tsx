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

export const handleSocialAuth = async (
  provider: "google" | "facebook"
): Promise<SocialAuthResult> => {
  try {
    let user;
    if (provider === "google") user = await loginWithGoogle();
    if (provider === "facebook") user = await loginWithFacebook();

    if (!user) throw new Error("No user returned from Firebase");

    const idToken = await user.getIdToken();

    const backendResponse = await socialLoginBackend(idToken, provider);

    console.log("Backend response:", backendResponse);
    if (!backendResponse.token) throw new Error("Backend did not return JWT token");
    return { success: true, token: backendResponse.token, user: backendResponse.user };


  } catch (error: any) {
    console.error("Social auth failed:", error);
    throw error;
  }
};

