import { loginWithGoogle, loginWithFacebook } from "../../../config/firebaseConfig";
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

    localStorage.setItem("token", idToken); 
    localStorage.setItem("user", JSON.stringify(backendResponse.user));

    window.location.href = "/home";
  } catch (error: any) {
    console.error("Social auth failed:", error);
    alert("Authentication failed: " + error.message);
  }
};

