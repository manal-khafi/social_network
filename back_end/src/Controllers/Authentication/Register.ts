import { Request, Response } from "express";
import prisma from "../../config/prismaClient";
import bcrypt from "bcrypt";
import { sendVerificationEmail } from "../../util/EempleEmail";
import { generateEmailVerifyToken } from "../../util/jwt";
import { logger } from "../../util/logger";

export const Register = async (req: Request, res: Response) => {
  try {
    const {
      username,
      email,
      password,
      confirmPassword,
      display_name,
      bio,
      date_of_birth,
      account_name,
      provider,
      adresse,
      gender
    } = req.body;

    // 1. Required fields
    if (!username || !email || !password || !confirmPassword || !adresse || !display_name) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be filled",
      });
    }

    // 2. Email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
      });
    }

    // 3. Password
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters",
      });
    }

    // 4. Password confirmation
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match",
      });
    }

    // 5. Address
    const adresseRegex = /^[a-zA-Z0-9\s,.'-]{5,120}$/;
    if (!adresseRegex.test(adresse)) {
      return res.status(400).json({
        success: false,
        message: "Invalid address format (5 to 120 characters, no special symbols)",
      });
    }

    // 6. Age (13+)
    const birthDate = new Date(date_of_birth);
    const ageDiff = Date.now() - birthDate.getTime();
    const age13Ms = 13 * 365.25 * 24 * 60 * 60 * 1000;

    if (date_of_birth && ageDiff < age13Ms) {
      return res.status(400).json({
        success: false,
        message: "You must be at least 13 years old to register",
      });
    }

    // 7. Email already registered?
    const existUser = await prisma.user.findFirst({
      where: { OR: [{ email }] },
    });

    if (existUser) {
      return res.status(400).json({
        success: false,
        message: "Email already in use",
      });
    }

    // 8. Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 9. Email verification is REQUIRED by default. AUTH_AUTO_VERIFY=true skips it
    // and is a development convenience only (e.g. no email provider configured locally).
    const autoVerify = process.env.AUTH_AUTO_VERIFY === "true";

    // 10. Create the user
    const newUser = await prisma.user.create({
      data: {
        username,
        email,
        password_hash: hashedPassword,
        display_name: display_name || "",
        bio: bio || null,
        avatar_url: null,
        is_private: false,
        is_verified: autoVerify,
        is_active: true,
        provider: provider || "local",
        gender: gender || null,
        date_of_birth: date_of_birth ? new Date(date_of_birth) : null,
        account_name: account_name || null,
        last_login: new Date(),
        adresse: adresse,
      },
    });

    // 11. Send the verification email. If it cannot be sent the account could
    // never be activated, so roll the registration back instead of silently
    // marking it verified; the user can simply register again later.
    let emailSent = false;
    if (!autoVerify) {
      try {
        const token = generateEmailVerifyToken({ userId: newUser.id, email: newUser.email });
        await sendVerificationEmail(email, username, token);
        emailSent = true;
      } catch (mailErr) {
        logger.error({ err: mailErr, userId: newUser.id }, "verification email failed to send: registration rolled back (see the preceding \"Email could not be sent\" log for the cause)");
        await prisma.user.delete({ where: { id: newUser.id } });
        return res.status(503).json({
          success: false,
          message: "We could not send the verification email. Please try again later.",
        });
      }
    }

    // 12. Success
    return res.status(201).json({
      success: true,
      message: emailSent
        ? "Registration successful! Please check your email to activate your account."
        : "Registration successful! You can now sign in.",
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        display_name: newUser.display_name,
        date_of_birth: newUser.date_of_birth,
        account_name: newUser.account_name,
        gender: newUser.gender,
        bio: newUser.bio,
        avatar_url: newUser.avatar_url,
        onboarding_done: newUser.onboarding_done
      },
    });

  } catch (error) {
    logger.error({ err: error }, "registration failed");
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
