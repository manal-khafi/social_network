import dotenv from "dotenv";
import nodemailer from "nodemailer";

dotenv.config(); // <- Très important : doit être ici en premier !

export const createSimpleTransporter = () => {
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      servername: "smtp.gmail.com",
      rejectUnauthorized: false,
    },
  });
};

// Création APRÈS dotenv
export let Transporter = createSimpleTransporter();

export const initializeEmailService = async () => {
  try {
    await Transporter.verify();
    console.log("✅ Serveur SMTP connecté avec succès");
  } catch (error) {
    console.error("❌ Erreur SMTP :", error);
  }
  return Transporter;
};
