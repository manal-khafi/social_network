import { Request, Response } from "express";
import { AuthService } from "../../Service/authService";

export const forgotPassword = async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email requis" });
  }

  try {
    await AuthService.forgotPassword(email);
    return res.json({
      message: "Email de réinitialisation envoyé si le compte existe",
    });
  } catch (err) {
    console.error("Forgot password error:", err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
};
