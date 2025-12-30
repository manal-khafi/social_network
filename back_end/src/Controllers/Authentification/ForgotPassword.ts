import { Request, Response } from "express";
import { prisma } from "../../config/prisma_client";
import { firebaseAuth } from "../../utils/firebase";

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: "Email is required",
      });
    }

    // Ne pas révéler si l’email existe ou non (sécurité)
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(200).json({
        message: "If the account exists, a reset email has been sent",
      });
    }

    // Générer le lien de réinitialisation via Firebase
    const resetLink = await firebaseAuth.generatePasswordResetLink(email);

    //  Ici tu peux envoyer le lien par email (nodemailer, sendgrid, etc.)
    console.log("Password reset link:", resetLink);

    return res.status(200).json({
      message: "If the account exists, a reset email has been sent",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};
