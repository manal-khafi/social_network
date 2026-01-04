import { Request, Response } from "express";
import { PrismaClient } from "../../../generated/prisma/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import {  sendVerificationEmail } from "../../util/EempleEmail";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "ariqerhtuzerj";

export const Register = async (req: Request, res: Response) => {
  try {
    const { username, email, password, confirmPassword } = req.body;

    // Validation des champs
    if (!username || !email || !password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Tous les champs obligatoires doivent être remplis",
      });
    }

    // Validation email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Format d'email invalide",
      });
    }

    // Validation mot de passe
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Le mot de passe doit contenir au moins 8 caractères",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Les mots de passe ne correspondent pas",
      });
    }

    // Vérifier si user existe déjà
    const existUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: email }, { username: username }], // ✅ Correction OR
      },
    });

    if (existUser) {
      return res.status(400).json({
        success: false,
        message: "Email ou nom d'utilisateur déjà utilisé",
      });
    }

    // Hasher le mot de passe
    const salt = await bcrypt.genSalt(10);
    const Hashpassword = await bcrypt.hash(password, salt);

    // Créer user avec les bons champs Prisma
    const newUser = await prisma.user.create({
      data: {
        username: username,
        email: email,
        password_hash: Hashpassword, // ✅ Correction ici
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

    // Générer token JWT pour vérification email
    const token = jwt.sign(
      { userId: newUser.id, email: newUser.email },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Envoyer email de vérification
    try {
      await sendVerificationEmail(email, username, token);
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Échec de l'envoi de l'email de vérification",
      });
    }

    return res.status(201).json({
      success: true,
      message: "Compte créé avec succès, veuillez vérifier votre email",
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
      },
    });
  } catch (error) {
    console.error("Erreur lors de l'inscription :", error);
    return res.status(500).json({
      success: false,
      message: "Erreur serveur",
    });
  }
};
