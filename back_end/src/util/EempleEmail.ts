import { initializeEmailService } from "../config/EmailConfig";
import { Transporter } from "../config/EmailConfig"; // import simple

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export const sendEmail = async (options: EmailOptions) => {
  try {
    if (!Transporter?.sendMail) {
      await initializeEmailService();
    }

    const info = await Transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME || "ANMOUGAR"}" <${process.env.SMTP_USER}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ""),
    });

    console.log("📨 Email envoyé :", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("❌ Échec envoi email :", error);
    throw error;
  }
};




export const sendVerificationEmail = async (email: string, username: string, token: string) => {
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

  return sendEmail({
    to: email,
    subject: "Vérifiez votre adresse email",
    html,
  });
};
