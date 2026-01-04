import { Request, Response } from "express";
import { forgotPassword } from "../../Service/authService";

export const forgotPasswordController = async (req: Request, res: Response) => {
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
  } catch (err) {
    console.error("Forgot password error:", err);
    return res.status(500).json({ success: false, message: "Server error. Please try again later." });
  }
};
