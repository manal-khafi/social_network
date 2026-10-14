import prisma from "../../config/prismaClient";
import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { generateTwoFactorLoginToken } from "../../util/jwt";
import { issueLoginSession, sessionUserInclude } from "../../services/sessionService";

// Compared against when the account does not exist (or has no password), so
// that case costs the same bcrypt work as a wrong password and response time
// does not reveal which accounts exist.
const DUMMY_PASSWORD_HASH = bcrypt.hashSync("no-such-account", 10);

// One answer for "no such account" and "wrong password".
const invalidCredentials = (res: Response) =>
  res.status(401).json({
    success: false,
    message: "Invalid credentials",
  });

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
      include: sessionUserInclude,
    });

    const isValidPassword = await bcrypt.compare(
      String(password),
      user?.password_hash ?? DUMMY_PASSWORD_HASH
    );

    if (!user || !user.password_hash || !isValidPassword) {
      return invalidCredentials(res);
    }

    // Account-state checks come only after the password is proven, so their
    // messages cannot be used to probe which emails are registered.
    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: "This account has been deactivated. Contact support to reactivate.",
      });
    }

    if (!user.is_verified) {
      return res.status(403).json({
        success: false,
        message: "Please verify your email before signing in.",
      });
    }

    // 2FA enabled: the password alone is not enough. Issue no access/refresh
    // token yet, only a short-lived challenge that must be exchanged together
    // with a TOTP code at POST /api/auth/2fa/verify-login.
    if (user.two_factor_enabled) {
      return res.status(200).json({
        success: true,
        requiresTwoFactor: true,
        twoFactorToken: generateTwoFactorLoginToken({
          id: user.id,
          token_version: user.token_version,
        }),
        message: "Two-factor authentication code required",
      });
    }

    const session = await issueLoginSession(res, user);

    return res.status(200).json({
      success: true,
      message: "Signed in successfully",
      ...session,
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
