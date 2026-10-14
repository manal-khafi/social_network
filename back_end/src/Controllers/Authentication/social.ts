import { Request, Response } from "express";
import { admin, isFirebaseConfigured } from "../../config/fireBase";
import { findOrCreateSocialUser, startSession } from "../../services/socialAccountService";

export const socialLogin = async (req: Request, res: Response) => {
  console.log("Social login request received."); // Log request hit
  if (!isFirebaseConfigured) {
    return res.status(503).json({
      success: false,
      message: "Social login is not configured on this server",
    });
  }

  const { idToken, token } = req.body;
  const firebaseIdToken = idToken || token;

  if (!firebaseIdToken) {
    console.log("idToken missing from request body."); // Log missing idToken
    return res.status(400).json({ success: false, message: "idToken required" });
  }

  let decodedToken;
  try {
    decodedToken = await admin.auth().verifyIdToken(firebaseIdToken);
    console.log("Firebase ID token verified successfully. UID:", decodedToken.uid); // Log verifyIdToken success
  } catch (error) {
    console.error("Firebase token verification failed:", error); // Log verifyIdToken failure
    return res.status(401).json({ success: false, message: "Invalid Firebase token" });
  }

  try {
    const email = decodedToken.email;
    const displayName = decodedToken.name || "";
    const avatarUrl = decodedToken.picture || "";
    const firebaseSignInProvider =
      decodedToken.firebase?.sign_in_provider || decodedToken.sign_in_provider || "firebase";

    if (!email) {
      console.log("Email not found in decoded Firebase token.");
      return res.status(400).json({ success: false, message: "Email not found in token" });
    }

    const result = await findOrCreateSocialUser({
      email,
      emailVerified: decodedToken.email_verified === true,
      name: displayName,
      picture: avatarUrl,
      provider: firebaseSignInProvider,
    });
    if (result.status === "account_exists_with_different_method") {
      return res.status(409).json({
        success: false,
        code: "account_exists_with_different_method",
        message:
          "An account already exists with this email. Please sign in with the method you originally used (email/password or Google).",
      });
    }
    if (result.status === "deactivated") {
      return res.status(403).json({
        success: false,
        message: "This account has been deactivated. Contact support to reactivate.",
      });
    }
    const user = result.user;
    const accessToken = await startSession(res, user);

    // Log the keys of the returned response
    console.log("Responding with keys: success, token, user");
    res.json({
      success: true,
      token: accessToken, // Return the backend JWT
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        display_name: user.display_name,
        avatar_url: user.avatar_url,
        is_verified: user.is_verified,
        provider: user.provider,
        onboarding_done: user.onboarding_done,
        // Add other user fields as necessary, excluding sensitive ones
      },
    });
  } catch (error) {
    const prismaError = error as { code?: string };
    if (prismaError?.code === "P2021") {
      console.error("Database schema missing required tables:", error);
      return res.status(500).json({
        success: false,
        message: "Database is not initialized. Run Prisma migrations.",
      });
    }
    console.error("Social login failed due to server error:", error);
    res.status(500).json({ success: false, message: "Social login failed" });
  }
};
