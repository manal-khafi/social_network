import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { sendVerificationEmail } from "../../util/EempleEmail";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "ariqerhtuzerj";

export const Register = async (req: Request, res: Response) => {
  try {
    const { username, email, password, confirmPassword } = req.body;

    // Validate required fields
    if (!username || !email || !password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be filled",
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
      });
    }

    // Validate password
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match",
      });
    }

    // Check if user already exists
    const existUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: email }, { username: username }],
      },
    });

    if (existUser) {
      return res.status(400).json({
        success: false,
        message: "Email or username already in use",
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const Hashpassword = await bcrypt.hash(password, salt);

    // Create new user
    const newUser = await prisma.user.create({
      data: {
        username: username,
        email: email,
        password_hash: Hashpassword,
        display_name: "",
        bio: null,
        avatar_url: null,
        is_private: false,
        is_verified: false,
        is_active: true,
        last_login: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    // Generate JWT token for email verification
    const token = jwt.sign(
      { userId: newUser.id, email: newUser.email },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Send verification email
    try {
      await sendVerificationEmail(email, username, token);
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to send verification email",
      });
    }

    return res.status(201).json({
      success: true,
      message:
        "Registration successful! Please check your email to activate your account.",
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
      },
    });
  } catch (error) {
    console.error("Error during registration:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
