import { EMAIL_FROM, getEmailClient } from "../config/EmailConfig";
import { logger } from "./logger";

// Public base URL of the frontend, used to build links inside outgoing emails.
// Falls back to the local dev server so nothing breaks when running locally.
const FRONTEND_URL = (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/+$/, "");

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/** Turns the most common Resend failures into an actionable fix for the logs. */
const resendErrorHint = (name: string, message: string): string | undefined => {
  if (name === "missing_api_key" || name === "invalid_api_key" || name === "restricted_api_key") {
    return "RESEND_API_KEY is wrong or lacks send permission: create a key with 'Sending access' at https://resend.com/api-keys";
  }
  if (name === "invalid_from_address" || /domain is not verified/i.test(message)) {
    return "EMAIL_FROM must use a domain verified in Resend (https://resend.com/domains)";
  }
  if (name === "validation_error" && /testing emails|own email address/i.test(message)) {
    return "The resend.dev test sender only delivers to the Resend account owner: verify a domain and set EMAIL_FROM to it";
  }
  if (name === "daily_quota_exceeded" || name === "monthly_quota_exceeded" || name === "rate_limit_exceeded") {
    return "Resend sending quota or rate limit reached";
  }
  return undefined;
};

export const sendEmail = async (options: EmailOptions) => {
  const client = await getEmailClient();
  if (!client) {
    logger.error({ to: options.to }, "Email not sent: RESEND_API_KEY is not set");
    throw new Error("Email service is not configured");
  }

  // The Resend SDK reports API failures in `error` instead of throwing; it can
  // still throw on network-level failures (DNS, TLS, timeouts).
  let result: Awaited<ReturnType<typeof client.emails.send>>;
  try {
    result = await client.emails.send({
      from: EMAIL_FROM,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ""),
    });
  } catch (err) {
    logger.error({ err, from: EMAIL_FROM, to: options.to }, "Email could not be sent: Resend request failed");
    throw new Error(`Email could not be sent: ${err instanceof Error ? err.message : String(err)}`);
  }

  const { data, error } = result;
  if (error) {
    logger.error(
      {
        resend: { name: error.name, statusCode: error.statusCode, message: error.message },
        hint: resendErrorHint(error.name, error.message),
        from: EMAIL_FROM,
        to: options.to,
      },
      "Email could not be sent: Resend rejected the request"
    );
    throw new Error(`Email could not be sent: ${error.name}: ${error.message}`);
  }

  return data;
};

export const sendVerificationEmail = async (email: string, username: string, token: string) => {
  const verificationLink = `${FRONTEND_URL}/verify-email?token=${token}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4F46E5;">Verify your email address</h2>
      <p>Hi ${username},</p>
      <p>To activate your account, click the link below:</p>
      <p style="text-align:center;margin:24px 0;">
        <a href="${verificationLink}" style="background:#4F46E5;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none;font-weight:bold;">
          Verify my email
        </a>
      </p>
      <p style="background:#f3f3f3;padding:10px;border-radius:6px;word-break:break-all;">${verificationLink}</p>
      <p><strong>This link expires in 24 hours.</strong></p>
      <p>If this wasn't you, you can ignore this email.</p>
      <p>The ${process.env.APP_NAME || ""} team</p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: "Verify your email address",
    html,
  });
};

export const sendResetPasswordEmail = async (email: string, token: string) => {
  const resetLink = `${FRONTEND_URL}/reset-password?token=${token}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4F46E5;">Reset your password</h2>
      <p>Hi,</p>
      <p>You asked to reset your password. Click the link below to set a new one:</p>
      <p style="text-align:center;margin:24px 0;">
        <a href="${resetLink}" style="background:#4F46E5;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none;font-weight:bold;">
          Reset my password
        </a>
      </p>
      <p style="background:#f3f3f3;padding:10px;border-radius:6px;word-break:break-all;">${resetLink}</p>
      <p><strong>This link expires in 1 hour.</strong></p>
      <p>If you didn't request this, you can ignore this email.</p>
      <p>The ${process.env.APP_NAME || ""} team</p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: "Reset your password",
    html,
  });
};
