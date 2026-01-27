import { Request, Response } from "express";
import { admin } from "../../config/fireBase";
import prisma from "../../config/prismaClient";
import { generateAccessToken, generateRefreshToken } from "../../util/jwt";

export const socialLogin = async (req: Request, res: Response) => {
  console.log("Social login request received."); // Log request hit
  const { idToken, token } = req.body;
  const firebaseIdToken = idToken || token;

  if (!firebaseIdToken) {
    console.log("idToken missing from request body."); // Log missing idToken
    return res.status(400).json({ success: false, message: "idToken required" });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(firebaseIdToken);
    console.log("Firebase ID token verified successfully. UID:", decodedToken.uid); // Log verifyIdToken success

    const email = decodedToken.email;
    const displayName = decodedToken.name || "";
    const avatarUrl = decodedToken.picture || "";
    const firebaseSignInProvider = decodedToken.firebase.sign_in_provider;

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
        },
      });
    } else {
      console.log("Existing user found for email:", email);
      // Optionally update user's provider if they previously signed up with email/password
      if (user.provider !== firebaseSignInProvider) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { provider: firebaseSignInProvider },
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
    const refreshToken = generateRefreshToken({
      id: user.id,
      token_version: user.token_version,
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
    });

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
    console.error("Firebase token verification failed or other error:", error); // Log verifyIdToken failure
    res.status(401).json({ success: false, message: "Invalid Firebase token" });
  }
};
