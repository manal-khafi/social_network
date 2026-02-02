import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

let transporter: nodemailer.Transporter | null = null;

export const initializeEmailService = async () => {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,          // ✅ from env
    port: Number(process.env.SMTP_PORT),  // ✅ from env
    secure: false,
    auth: {
      user: process.env.SMTP_USER!,
      pass: process.env.SMTP_PASS!,
    },
  });

  // ✅ DO NOT crash app if SMTP fails
  transporter.verify()
    .then(() => console.log("📧 SMTP ready"))
    .catch(err =>
      console.error("⚠️ SMTP not available:", err.message)
    );

  return transporter;
};

export const getTransporter = async () => {
  if (!transporter) {
    await initializeEmailService();
  }
  return transporter!;
};
