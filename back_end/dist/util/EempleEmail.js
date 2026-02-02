"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendResetPasswordEmail = exports.sendVerificationEmail = exports.sendEmail = void 0;
const EmailConfig_1 = require("../config/EmailConfig");
const sendEmail = async (options) => {
    try {
        const transporter = await (0, EmailConfig_1.getTransporter)();
        return await transporter.sendMail({
            from: `"ANMOUGAR" <${process.env.SMTP_USER}>`,
            to: options.to,
            subject: options.subject,
            html: options.html,
            text: options.text || options.html.replace(/<[^>]*>/g, ""),
        });
    }
    catch (error) {
        console.error("❌ Email error:", error);
        throw error;
    }
};
exports.sendEmail = sendEmail;
const sendVerificationEmail = async (email, username, token) => {
    const verificationLink = `http://localhost:5173/verify-email?token=${token}`;
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
    return (0, exports.sendEmail)({
        to: email,
        subject: "Vérifiez votre adresse email",
        html,
    });
};
exports.sendVerificationEmail = sendVerificationEmail;
const sendResetPasswordEmail = async (email, token) => {
    const resetLink = `http://localhost:5173/reset-password?token=${token}`;
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
    return (0, exports.sendEmail)({
        to: email,
        subject: "Réinitialisez votre mot de passe",
        html,
    });
};
exports.sendResetPasswordEmail = sendResetPasswordEmail;
