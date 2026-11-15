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

// ---- Branded templates -----------------------------------------------------
// Table-based layout with inline styles: the only markup every email client
// (Gmail, Outlook, Apple Mail) renders reliably.

const BRAND = {
  dark: "#18534f", // header background, headings
  teal: "#226d68", // accents, links
  accent: "#d6955b", // CTA button, highlights
  background: "#ecf8f6", // email background
  card: "#ffffff",
  text: "#1a1a1a",
  muted: "#6b7280", // footer, notes
};

/** The app's logo, exactly as in the frontend. Its center circle is the header's
 * own color, so it sits on a white badge to stay visible. Some clients (e.g.
 * Gmail) drop inline SVG; the "ANMOUGAR" wordmark keeps the header readable there. */
const LOGO_SVG = `<svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Anmougar logo" style="display:block;">
  <circle cx="20" cy="20" r="5" fill="#18534f"/>
  <circle cx="8" cy="12" r="4" fill="#226d68"/>
  <circle cx="32" cy="12" r="4" fill="#226d68"/>
  <circle cx="8" cy="28" r="4" fill="#d6955b"/>
  <circle cx="32" cy="28" r="4" fill="#d6955b"/>
  <line x1="20" y1="20" x2="8" y2="12" stroke="#226d68" stroke-width="2"/>
  <line x1="20" y1="20" x2="32" y2="12" stroke="#226d68" stroke-width="2"/>
  <line x1="20" y1="20" x2="8" y2="28" stroke="#d6955b" stroke-width="2"/>
  <line x1="20" y1="20" x2="32" y2="28" stroke="#d6955b" stroke-width="2"/>
</svg>`;

interface BrandedEmail {
  /** Hidden preview line shown next to the subject in the inbox list. */
  preheader: string;
  heading: string;
  message: string;
  buttonLabel: string;
  buttonUrl: string;
  note: string;
}

const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

const footerText = () => `© ${new Date().getFullYear()} Anmougar · anmougar.online`;

const renderEmail = (e: BrandedEmail) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light">
  <title>${e.heading}</title>
  <style>
    @media only screen and (max-width: 600px) {
      .outer { padding: 20px 12px !important; }
      .header { padding: 20px !important; }
      .content { padding: 20px !important; }
      .heading { font-size: 22px !important; }
      .button a { display: block !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:${BRAND.background};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${e.preheader}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${BRAND.background};">
    <tr>
      <td class="outer" align="center" style="padding:40px 20px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;margin:0 auto;border-collapse:separate;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td class="header" align="center" style="background-color:${BRAND.dark};border-radius:16px 16px 0 0;padding:32px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center">
                <tr>
                  <td style="vertical-align:middle;padding-right:12px;">
                    <div style="background-color:#ffffff;border-radius:12px;padding:4px;line-height:0;">${LOGO_SVG}</div>
                  </td>
                  <td style="vertical-align:middle;font-family:${FONT};font-size:20px;font-weight:bold;letter-spacing:3px;color:#ffffff;">ANMOUGAR</td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Card -->
          <tr>
            <td class="content" style="background-color:${BRAND.card};padding:40px;border-radius:0 0 16px 16px;font-family:${FONT};color:${BRAND.text};">
              <h1 class="heading" style="margin:0 0 16px;font-size:26px;line-height:1.3;color:${BRAND.dark};">${e.heading}</h1>
              <p style="margin:0 0 32px;font-size:16px;line-height:1.6;color:${BRAND.text};">${e.message}</p>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td class="button" align="center">
                    <a href="${e.buttonUrl}" target="_blank" style="display:inline-block;background-color:${BRAND.accent};color:#ffffff;font-size:16px;font-weight:bold;text-decoration:none;padding:16px 32px;border-radius:8px;">${e.buttonLabel}</a>
                  </td>
                </tr>
              </table>
              <p style="margin:32px 0 8px;font-size:13px;line-height:1.6;color:${BRAND.muted};">If the button doesn't work, copy and paste this link into your browser:</p>
              <p style="margin:0 0 24px;font-size:13px;line-height:1.5;word-break:break-all;"><a href="${e.buttonUrl}" target="_blank" style="color:${BRAND.teal};">${e.buttonUrl}</a></p>
              <p style="margin:0;padding-top:20px;border-top:1px solid ${BRAND.background};font-size:13px;line-height:1.6;color:${BRAND.muted};">${e.note}</p>
            </td>
          </tr>
        </table>
        <!-- Footer -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;margin:0 auto;">
          <tr>
            <td align="center" style="padding:24px 16px 0;font-family:${FONT};font-size:12px;text-align:center;color:${BRAND.muted};">${footerText()}</td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

/** Plain-text alternative: improves deliverability and serves text-only clients. */
const renderText = (e: BrandedEmail) =>
  [e.heading, "", e.message, "", `${e.buttonLabel}: ${e.buttonUrl}`, "", e.note, "", footerText()].join("\n");

const sendBranded = (to: string, subject: string, email: BrandedEmail) =>
  sendEmail({ to, subject, html: renderEmail(email), text: renderText(email) });

export const sendVerificationEmail = async (email: string, _username: string, token: string) =>
  sendBranded(email, "Verify your Anmougar account ✉️", {
    preheader: "Verify your email address to activate your Anmougar account.",
    heading: "Welcome to Anmougar! 👋",
    message:
      "Thanks for joining! Please verify your email address to activate your account and start connecting with your community.",
    buttonLabel: "Verify My Email",
    buttonUrl: `${FRONTEND_URL}/verify-email?token=${encodeURIComponent(token)}`,
    note: "This link expires in 24 hours. Didn't create an account? You can safely ignore this email.",
  });

export const sendResetPasswordEmail = async (email: string, token: string) =>
  sendBranded(email, "Reset your Anmougar password 🔑", {
    preheader: "Use this link to set a new password for your Anmougar account.",
    heading: "Reset your password",
    message:
      "We received a request to reset the password for your Anmougar account. Click below to set a new password.",
    buttonLabel: "Reset My Password",
    buttonUrl: `${FRONTEND_URL}/reset-password?token=${encodeURIComponent(token)}`,
    note: "This link expires in 15 minutes. Didn't request this? You can safely ignore this email.",
  });
