import { Resend } from "resend";
import dotenv from "dotenv";
import { logger } from "../util/logger";

dotenv.config();

// Emails go out through Resend's HTTPS API rather than SMTP: hosts such as
// Render's free tier block outbound SMTP ports, HTTPS always works.

/**
 * Sender shown on outgoing emails. Resend's shared "onboarding@resend.dev"
 * address needs no domain setup but only delivers to the Resend account's own
 * email address; set EMAIL_FROM to an address on a domain verified in Resend to
 * email real users.
 */
export const EMAIL_FROM = process.env.EMAIL_FROM?.trim() || "Anmougar <onboarding@resend.dev>";

let client: Resend | null = null;
let initialized = false;

/**
 * Creates the Resend client. Without RESEND_API_KEY the API still starts:
 * email sending is disabled and sendEmail() fails with a clear error.
 */
export const initializeEmailService = async () => {
  if (initialized) return client;
  initialized = true;

  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    logger.warn("RESEND_API_KEY is not set: email sending is disabled");
    return client;
  }

  client = new Resend(apiKey);
  // What emails will be sent with (never the key itself).
  logger.info({ provider: "resend", from: EMAIL_FROM }, "Email service ready");
  return client;
};

/** The Resend client, or null when email sending is disabled. */
export const getEmailClient = async () => {
  if (!initialized) await initializeEmailService();
  return client;
};
