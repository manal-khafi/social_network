import { initializeEmailService } from "../config/EmailConfig";
import { getTransporter } from "../config/EmailConfig";

// Public base URL of the frontend, used to build links inside outgoing emails.
// Falls back to the local dev server so nothing breaks when running locally.
const FRONTEND_URL = (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/+$/, "");

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export const sendEmail = async (options: EmailOptions) => {
  try {
    const transporter = await getTransporter();

    return await transporter.sendMail({
      from: `"ANMOUGAR" <${process.env.SMTP_USER}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ""),
    });
  } catch (error) {
    console.error("❌ Email error:", error);
    throw error;
  }
};





export const sendVerificationEmail = async (email: string, username: string, token: string) => {
  const verificationLink = `${FRONTEND_URL}/verify-email?token=${token}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4F46E5;">Vérification de votre adresse email</h2>
      <p>Bonjour ${username},</p>
      <p>Pour activer votre compte, cliquez sur le lien ci-dessous :</p>
      <p style="text-align:center;margin:24px 0;">
        <a href="${verificationLink}" style="background:#4F46E5;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none;font-weight:bold;">
          Vérifier mon email
        </a>
      </p>
      <p style="background:#f3f3f3;padding:10px;border-radius:6px;word-break:break-all;">${verificationLink}</p>
      <p><strong>Ce lien expire dans 24h.</strong></p>
      <p>Si ce n’était pas vous, ignorez cet email.</p>
      <p>L'équipe ${process.env.APP_NAME || ""}</p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: "Vérifiez votre adresse email",
    html,
  });
};

export const sendResetPasswordEmail = async (email: string, token: string) => {
  const resetLink = `${FRONTEND_URL}/reset-password?token=${token}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4F46E5;">Réinitialisation de votre mot de passe</h2>
      <p>Bonjour,</p>
      <p>Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le lien ci-dessous pour définir un nouveau mot de passe :</p>
      <p style="text-align:center;margin:24px 0;">
        <a href="${resetLink}" style="background:#4F46E5;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none;font-weight:bold;">
          Réinitialiser mon mot de passe
        </a>
      </p>
      <p style="background:#f3f3f3;padding:10px;border-radius:6px;word-break:break-all;">${resetLink}</p>
      <p><strong>Ce lien expire dans 1 heure.</strong></p>
      <p>Si vous n’avez pas demandé cette réinitialisation, ignorez cet email.</p>
      <p>L'équipe ${process.env.APP_NAME || ""}</p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: "Réinitialisez votre mot de passe",
    html,
  });
};
