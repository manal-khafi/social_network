import { Request, Response } from "express";
import { verifyResetToken, resetPassword } from "../../services/authService";

export const verifyResetTokenController = async (req: Request, res: Response) => {
  const { token } = req.params as { [key: string]: string };
  if (!token) return res.status(400).json({ success: false, message: "Token requis" });

  const user = await verifyResetToken(token as string);
  if (!user) return res.status(400).json({ success: false, message: "Invalid or expired token" });

  res.status(200).json({ success: true, message: "Token valide" });
};

export const resetPasswordController = async (req: Request, res: Response) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) return res.status(400).json({ success: false, message: "Champs manquants" });

  try {
    await resetPassword(token, newPassword);
    res.status(200).json({ success: true, message: "Password updated successfully" });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};
