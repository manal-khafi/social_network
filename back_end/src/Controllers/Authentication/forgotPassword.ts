import { Request, Response } from "express";
import { forgotPassword } from "../../Service/authService";

export const forgotPasswordController = async (req: Request, res: Response) => {
  console.log("✅ FORGOT PASSWORD ENDPOINT HIT");
  console.log("BODY:", req.body);
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, message: "Email is required" });
  }

  try {
    await forgotPassword(email);
    return res.status(200).json({
      success: true,
      message: "Password reset email sent! Check your inbox.",
    });
  } catch (err: any) {
    console.error("🔥 FORGOT PASSWORD ERROR 🔥");
    console.error(err);
    console.error(err?.message);
    console.error(err?.stack);

    return res.status(500).json({
      success: false,
      message: err?.message || "Server error",
    });
  }

};
