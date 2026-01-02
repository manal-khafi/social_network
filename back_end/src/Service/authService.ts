import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();

export const forgotPassword = async (email: string) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return; // ne pas révéler si l'utilisateur existe

  // Génération d'un token cryptographiquement sécurisé
  const resetToken = crypto.randomBytes(32).toString("hex");
  const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1h

  await prisma.user.update({
    where: { id: user.id },
    data: { reset_token: resetToken, reset_token_expiry: resetTokenExpiry },
  });

  // TODO: envoyer resetToken via email
  console.log(`Reset token (envoyer par email): ${resetToken}`);
};
