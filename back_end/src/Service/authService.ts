import prisma from "../config/prismaClient";
import jwt, { Secret, SignOptions } from "jsonwebtoken";
import bcrypt from "bcrypt";
import { sendResetPasswordEmail } from "../util/EempleEmail";

const RESET_SECRET_RAW = process.env.RESET_PASSWORD_SECRET;
if (!RESET_SECRET_RAW) throw new Error("RESET_PASSWORD_SECRET is not defined");

const RESET_SECRET: Secret = RESET_SECRET_RAW;



import { parseTimeString } from "../util/parseTime";
const signOptions: SignOptions = {
  expiresIn: parseTimeString(process.env.RESET_PASSWORD_EXPIRES_IN || "15m"),
  algorithm: "HS256",
};

export const forgotPassword = async (email: string) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error("No user found with this email");

  const resetToken = jwt.sign(
    { userId: user.id, email: user.email },
    RESET_SECRET,
    signOptions
  );

  await sendResetPasswordEmail(email, resetToken);
  console.log("Reset password token sent");
};

export const verifyResetToken = async (token: string) => {
  try {
    return jwt.verify(token, RESET_SECRET) as { userId: string; email: string };
  } catch {
    return null;
  }
};

export const resetPassword = async (token: string, newPassword: string) => {
  let payload: { userId: string };

  try {
    payload = jwt.verify(token, RESET_SECRET) as { userId: string };
  } catch {
    throw new Error("Token invalide ou expiré");
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: payload.userId },
    data: { password_hash: hashedPassword },
  });

  console.log("Password reset successful");
};
