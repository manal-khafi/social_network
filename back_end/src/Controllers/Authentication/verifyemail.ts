import { Request, Response } from "express";
import prisma from "../../config/prismaClient";
import { verifyEmailVerifyToken } from "../../util/jwt"


const verifyEmail = async (req: Request, res: Response) => {
  try {
    const { token } = req.query;
    if (!token || typeof token !== "string") {
      return res.status(400).json({ success: false, message: "Token is missing!" });
    }
    
    const decoded = verifyEmailVerifyToken(token) as {
      userId: string;
      email: string;
    };

    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found!" });
    }

    if (user.is_verified) {
      return res.json({ success: true, message: "Your email is already verified! You can log in." });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { is_verified: true },
    });

    return res.json({ success: true, message: "Your email has been verified! You can now log in." });
  } catch (error: any) {
    console.error("Verification error:", error);
    return res.status(500).json({ success: false, message: "Server error", detail: error.message });
  }
};

export default verifyEmail;
