import { Request, Response } from "express";
import * as AuthService from "../../services/registerService";
import sendingMail from "../../nodemailer/mailing";


export const signup = async (req: Request, res: Response) => {
  try {
    
    const { user, token } = await AuthService.registerUser(req.body);

    const verificationLink = `http://localhost:3000/api/auth/verify/${token}`;

    await sendingMail(
      user.email,
      "Verify your email",
      `Hello ${user.username},\n\nPlease verify your email: ${verificationLink}`
    );

    return res.status(201).json({
      message: "User registered successfully! Check your email.",
      accessToken: token,
    });
  } catch (error: any) {
    
    const status = error.message === "Email is already in use!" ? 400 : 500;
    return res.status(status).json({ message: error.message });
  }
};
