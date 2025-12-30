import { loginWithGoogle, loginWithFacebook } from "../../config/firebaseConfig";
import { socialLoginBackend } from "../utils/api";

export const handleSocialAuth = async (provider: "google" | "facebook") => {
  try {
    let user;
    if (provider === "google") user = await loginWithGoogle();
    if (provider === "facebook") user = await loginWithFacebook();

    if (!user) throw new Error("No user returned from Firebase");

    // Get Firebase ID token
    const idToken = await user.getIdToken();

    // Send token and provider to backend
    const backendResponse = await socialLoginBackend(idToken, provider);

    console.log("Backend response:", backendResponse);

    // Store token / user info in localStorage
    localStorage.setItem("token", idToken); // store Firebase token
    localStorage.setItem("user", JSON.stringify(backendResponse.user));

    // Redirect to dashboard
    window.location.href = "/dashboard";
  } catch (error: any) {
    console.error("Social auth failed:", error);
    alert("Authentication failed: " + error.message);
  }
};

// login.tsx

// import { handleSocialAuth } from "./socialAuth";

// <SocialButton provider="google" onClick={() => handleSocialAuth("google")} />
// <SocialButton provider="facebook" onClick={() => handleSocialAuth("facebook")} />


// Register.tsx
// import { handleSocialAuth } from "./socialAuth";

// <SocialButton provider="google" onClick={() => handleSocialAuth("google")} />
// <SocialButton provider="facebook" onClick={() => handleSocialAuth("facebook")} />