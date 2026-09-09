import prisma from "../../config/prismaClient";
import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { generateAccessToken, generateRefreshToken } from "../../util/jwt";

export const Login = async (req: Request, res: Response) => {
  try {
    const { email: loginIdentifier, password } = req.body;
    if (!loginIdentifier || !password) {
      return res.status(400).json({
        success: false,
        message: "Email/Username or password missing",
      });
    }

    // Attempt to find user by email OR username
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: loginIdentifier },
          { username: loginIdentifier }
        ]
      },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: { permission: true },
            },
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!user.is_verified) {
      return res.status(403).json({
        success: false,
        message: "Please verify your email before signing in.",
      });
    }

    if (!user.password_hash) {
      return res.status(400).json({
        success: false,
        message: "Incorrect credentials",
      });
    }

    const isValidPassword = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!isValidPassword) {
      return res.status(400).json({
        success: false,
        message: "Incorrect credentials",
      });
    }
    const permissions =
      user.role?.rolePermissions.map((rp: { permission: { code: string } }) => rp.permission.code) || [];
    
    const tokenPayload = {
      id: user.id,
      email: user.email,
      username: user.username,
      avatar_url: user.avatar_url ?? null,
      role: user.role?.name,
      permissions,
    };

    const token = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken({ 
      id: user.id,
      token_version: user.token_version
    });
    
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', 
      sameSite: 'lax', // Changed from 'strict' to 'lax'
      maxAge: 24 * 60 * 60 * 1000 
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { last_login: new Date() },
    });
    
    return res.status(200).json({
      success: true,
      message: "Signed in successfully",
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role?.name,
        permissions,
        onboarding_done: user.onboarding_done
      },
    });
  } catch (error) {
    console.error("login failed:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during sign-in",
    });
  }
};

export default Login;
