import { Request, Response } from "express";
import { verifyResetToken, resetPassword } from "../../Service/authService";

export const verifyResetTokenController = async (req: Request, res: Response) => {
  const { token } = req.query;
  if (!token) return res.status(400).json({ success: false, message: "Token requis" });

  const user = await verifyResetToken(token as string);
  if (!user) return res.status(400).json({ success: false, message: "Token invalide ou expiré" });

  res.status(200).json({ success: true, message: "Token valide" });
};

export const resetPasswordController = async (req: Request, res: Response) => {
  console.log("🔥 RESET PASSWORD HIT");
  console.log("BODY:", req.body);
  const { token, newPassword } = req.body;
  console.log("Received token:", token);
  console.log("Received newPassword:", newPassword);
  if (!token || !newPassword) return res.status(400).json({ success: false, message: "Champs manquants" });

  try {
    await resetPassword(token, newPassword);
    res.status(200).json({ success: true, message: "Mot de passe mis à jour avec succès" });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};
