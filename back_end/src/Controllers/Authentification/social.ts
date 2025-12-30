import { Request, Response } from "express";
import admin from "firebase-admin";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const socialLogin = async (req: Request, res: Response) => {
  const { token, provider } = req.body; // provider: "google" | "facebook"

  if (!token || !provider) {
    return res.status(400).json({ success: false, message: "Token and provider are required" });
  }

  try {
    // Verify Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(token);
    const email = decodedToken.email;
    const displayName = decodedToken.name || "";
    const avatarUrl = decodedToken.picture || "";

    if (!email) {
      return res.status(400).json({ success: false, message: "Email not found in token" });
    }

    // Find existing user or create new one
    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          username: email.split("@")[0], 
          display_name: displayName,
          avatar_url: avatarUrl,
          provider,
        },
      });
    }


    res.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Firebase token verification failed:", error);
    res.status(401).json({ success: false, message: "Invalid token" });
  }
};
