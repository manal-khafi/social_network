import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { generateAccessToken } from "../../util/jwt";

const prisma = new PrismaClient();

export const Login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email ou mot de passe manquant",
      });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Format d'email invalide",
      });
    }
    const user = await prisma.user.findFirst({
      where: { email },
      include: {
        role: {
          include: {
            rolePermissions: { include: { permission: true } },
          },
        },
      },
    });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur introuvable",
      });
    }

    if (!user.is_verified) {
      return res.status(403).json({
        success: false,
        message: "Veuillez vérifier votre email avant de vous connecter.",
      });
    }
    
    if (!user.password_hash) {
      return res.status(400).json({
        success: false,
        message: "Identifiants incorrects",
      });
    }
    
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(400).json({
        success: false,
        message: "Identifiants incorrects",
      });
    }
    const permissions = user.role?.rolePermissions.map((rp: any) => rp.permission.code) || [];
    const token = generateAccessToken({
      id: user.id,
      email: user.email,
      role: user.role?.name,
      permissions,
    });
    await prisma.user.update({
      where: { id: user.id },
      data: { last_login: new Date() },
    });
    let redirectTo = "/home";
    const roleName = user.role?.name?.toLowerCase() || "";

    if (roleName.includes("superadmin") || roleName.includes("super admin")) {
      redirectTo = "/dashboard";
    }
    return res.status(200).json({
      success: true,
      message: "Connexion réussie",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role?.name,
        permissions,
      },
      token,
      redirectTo,
    });

  } catch (error) {
    console.error("Erreur authentification :", error);
    return res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la connexion",
    });
  }
};

export default Login;
