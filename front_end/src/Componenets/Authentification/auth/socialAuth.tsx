import {
  loginWithGoogle,
  loginWithFacebook,
} from "../../../config/firebaseConfig";
import { socialLoginBackend } from "../../../util/api";
import { store } from "../../../store";
import { setAuth } from "../../../features/auth/authSlice";

export const handleSocialAuth = async (provider: "google" | "facebook") => {
  try {
    let user;
    if (provider === "google") user = await loginWithGoogle();
    if (provider === "facebook") user = await loginWithFacebook();

    if (!user) throw new Error("No user returned from Firebase");

    const idToken = await user.getIdToken();

    const backendResponse = await socialLoginBackend(idToken, provider);

    console.log("Backend response:", backendResponse);

    // Standardize token storage - use backend token if available, otherwise Firebase token
    const authToken = backendResponse.token || idToken;

    // Dispatch Redux action to update auth state
    store.dispatch(
      setAuth({
        user: backendResponse.user,
        token: authToken,
      })
    );

    window.location.href = "/home";
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Social auth failed:", error);
    alert("Authentication failed: " + errorMessage);
  }
};
