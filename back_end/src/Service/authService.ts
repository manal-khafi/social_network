import crypto from "crypto";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const AuthService = {
  forgotPassword: async (email: string) => {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return; // ne pas révéler si l'utilisateur existe

    // Génération d'un token cryptographiquement sécurisé
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenHash = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1h

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken: resetTokenHash, resetTokenExpiry },
    });

    // TODO: envoyer resetToken via email
    console.log(`Reset token (envoyer par email): ${resetToken}`);
  },
};
