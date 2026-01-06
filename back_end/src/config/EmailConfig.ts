import dotenv from "dotenv";
import nodemailer from "nodemailer";

dotenv.config();

let Transporter: nodemailer.Transporter | null = null;

export const initializeEmailService = async () => {
  if (Transporter) return Transporter;

  Transporter = nodemailer.createTransport({
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

  await Transporter.verify();
  console.log("✅ Serveur SMTP connecté avec succès");

  return Transporter;
};

export const getTransporter = async () => {
  if (!Transporter) {
    await initializeEmailService();
  }
  return Transporter!;
};
