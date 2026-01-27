import { loginWithGoogle, loginWithFacebook } from "../../../config/firebase";
import { socialLoginBackend } from "../../../utils/api";

export const handleSocialAuth = async (provider: "google" | "facebook") => {
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

