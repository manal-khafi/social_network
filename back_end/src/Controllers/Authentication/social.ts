import { Request, Response } from "express";
import { admin, isFirebaseConfigured } from "../../config/fireBase";
import prisma from "../../config/prismaClient";
import { generateAccessToken } from "../../util/jwt";
import { setRefreshTokenCookie } from "../../services/sessionService";

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

    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      console.log("User not found, creating new user for email:", email);
      user = await prisma.user.create({
        data: {
          email,
          username: email.split("@")[0],
          display_name: displayName,
          avatar_url: avatarUrl,
          is_verified: true,
          provider: firebaseSignInProvider, // Use Firebase sign-in provider
          onboarding_done: true, // Assuming social login implies onboarding is done
          token_version: 1, // brand-new account: start one above the default 0
        },
      });
    } else {
      console.log("Existing user found for email:", email);
      // Same email, different sign-in method (email/password, Google, Facebook):
      // the same account is used, but only when the provider has verified the
      // address. Otherwise anyone able to put someone else's email on a social
      // account (Facebook emails are often unverified in Firebase) could take
      // over that person's account.
      const sameMethod = user.provider === firebaseSignInProvider;
      if (!sameMethod && decodedToken.email_verified !== true) {
        return res.status(409).json({
          success: false,
          code: "account_exists_with_different_method",
          message:
            "An account already exists with this email. Please sign in with the method you originally used (email/password or Google).",
        });
      }
      if (!user.is_active) {
        return res.status(403).json({
          success: false,
          message: "This account has been deactivated. Contact support to reactivate.",
        });
      }
      // Remember the latest method; a verified provider email also confirms the
      // address of an email/password account that was never verified.
      if (!sameMethod || (!user.is_verified && decodedToken.email_verified === true)) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            provider: firebaseSignInProvider,
            ...(decodedToken.email_verified === true && { is_verified: true }),
          },
        });
      }
    }

    const userWithRole = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        role: {
          include: { rolePermissions: { include: { permission: true } } },
        },
      },
    });

    const permissions =
      userWithRole?.role?.rolePermissions.map(
        (rp: { permission: { code: string } }) => rp.permission.code
      ) || [];

    // Issue backend JWT + refresh token
    const accessToken = generateAccessToken({
      id: user.id,
      email: user.email,
      username: user.username,
      avatar_url: user.avatar_url ?? null,
      role: userWithRole?.role?.name,
      permissions,
      onboarding_done: user.onboarding_done,
    });
    setRefreshTokenCookie(res, user);

    console.log("Backend JWT issued. First 10 chars:", accessToken.substring(0, 10)); // Log issued token (partial)

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
