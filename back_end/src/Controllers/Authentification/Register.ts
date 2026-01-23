import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import { sendVerificationEmail } from "../../util/EempleEmail";
import { generateAccessToken } from "../../util/jwt";

const prisma = new PrismaClient();

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

    // 1. Validation des champs requis
    if (!username || !email || !password || !confirmPassword || !adresse) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be filled",
      });
    }

    // 2. Validation format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
      });
    }

    // 3. Validation mot de passe
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters",
      });
    }

    // 4. Validation confirmation password
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match",
      });
    }

    // 5. Validation adresse
    const adresseRegex = /^[a-zA-Z0-9\s,.'-]{5,120}$/;
    if (!adresseRegex.test(adresse)) {
      return res.status(400).json({
        success: false,
        message: "Invalid address format (5 to 120 characters, no special symbols)",
      });
    }

    // 6. Validation âge (minimum 13 ans)
    const birthDate = new Date(date_of_birth);
    const ageDiff = Date.now() - birthDate.getTime();
    const age13Ms = 13 * 365.25 * 24 * 60 * 60 * 1000;

    if (date_of_birth && ageDiff < age13Ms) {
      return res.status(400).json({
        success: false,
        message: "You must be at least 13 years old to register",
      });
    }

    // 7. Vérifier si email existe déjà
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

    // 9. Créer le user
    const newUser = await prisma.user.create({
      data: {
        username,
        email,
        password_hash: hashedPassword,
        display_name: display_name || "",
        bio: bio || null,
        avatar_url: null,
        is_private: false,
        is_verified: false,
        is_active: true,
        provider: provider || "local",
        gender: gender || null,
        date_of_birth: date_of_birth ? new Date(date_of_birth) : null,
        account_name: account_name || null,
        last_login: new Date(),
        adresse: adresse,
      },
    });

    // 10. Générer token JWT
    const token = generateAccessToken(
      { userId: newUser.id, email: newUser.email },
    );

    // 11. Envoi email verification
    await sendVerificationEmail(email, username, token);

    // 12. Réponse succès
    return res.status(201).json({
      success: true,
      message:
        "Registration successful! Please check your email to activate your account.",
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
