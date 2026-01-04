import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

const verifyEmail = async (req: Request, res: Response) => {
  try {
    const { token } = req.query;
    console.log("Token reçu :", token);

    if (!token || typeof token !== "string") {
      return res.status(400).json({ success: false, message: "Token manquant ou invalide !" });
    }

    // Décoder et vérifier le JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
      userId: string;
      email: string;
      exp: number;
    };

    console.log("JWT décodé :", decoded);

    // Chercher l'utilisateur par ID
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: "Utilisateur introuvable." });
    }

    // Vérifier expiration du token
    const isExpired = decoded.exp * 1000 < Date.now();
    if (isExpired) {
      return res.status(400).json({ success: false, message: "Le lien a expiré." });
    }

    // Mettre à jour l'utilisateur
    await prisma.user.update({
      where: { id: user.id },
      data: { is_verified: true },
    });

    return res.json({ success: true, message: "Email vérifié avec succès !" });

  } catch (error: any) {
    console.error("Erreur verification :", error);
    return res.status(500).json({ success: false, message: "Erreur serveur.", detail: error.message });
  }
};

export default verifyEmail;
