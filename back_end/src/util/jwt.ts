import jwt, { SignOptions, Secret } from "jsonwebtoken";
import { createHmac } from "crypto";
import dotenv from "dotenv";

dotenv.config();


const {
  AUTH_SECRET,
  AUTH_SECRET_EXPIRES_IN,
  AUTH_REFRESH_SECRET,
  AUTH_REFRESH_SECRET_EXPIRES_IN,
  RESET_SECRET,
  RESET_EXPIRES_IN,
  EMAIL_VERIFY_SECRET, 
  EMAIL_VERIFY_EXPIRES_IN
} = process.env;

if (!AUTH_SECRET || !AUTH_REFRESH_SECRET || !RESET_SECRET || !EMAIL_VERIFY_SECRET) {
  throw new Error("JWT secrets are missing in environment variables!");
}

const accessSecret: Secret = AUTH_SECRET;
const refreshSecret: Secret = AUTH_REFRESH_SECRET;
const resetSecret: Secret = RESET_SECRET;

type TokenExpiration = string | number;

const accessExpiresIn: TokenExpiration = AUTH_SECRET_EXPIRES_IN ?? "15m";
const refreshExpiresIn: TokenExpiration = AUTH_REFRESH_SECRET_EXPIRES_IN ?? "24h";
const resetExpiresIn: TokenExpiration = RESET_EXPIRES_IN ?? "15m";
const emailVerifySecret: Secret = EMAIL_VERIFY_SECRET;
const emailVerifyExpiresIn: TokenExpiration = EMAIL_VERIFY_EXPIRES_IN ?? "24h";

// Generate access token
export const generateAccessToken = (payload: object) =>
  jwt.sign(payload, accessSecret, { expiresIn: accessExpiresIn as SignOptions['expiresIn'] });

// Verify access token
export const verifyAccessToken = (token: string) =>
  jwt.verify(token, accessSecret);

// Generate refresh token
export const generateRefreshToken = (payload: object) =>
  jwt.sign(payload, refreshSecret, { expiresIn: refreshExpiresIn as SignOptions['expiresIn'] });

// Verify refresh token
export const verifyRefreshToken = (token: string) =>
  jwt.verify(token, refreshSecret);

// Generate reset password token
export const generateResetToken = (payload: object) =>
  jwt.sign(payload, resetSecret, { expiresIn: resetExpiresIn as SignOptions['expiresIn'] });

// Verify reset token
export const verifyResetToken = (token: string) =>
  jwt.verify(token, resetSecret);

// Generate email verification token
export const generateEmailVerifyToken = (payload: object) =>
  jwt.sign(payload, emailVerifySecret, { expiresIn: emailVerifyExpiresIn as SignOptions["expiresIn"] });

// Verify email verification token
export const verifyEmailVerifyToken = (token: string) =>
  jwt.verify(token, emailVerifySecret);

// --- Two-factor login challenge ---
// Issued by /login once the password is correct for an account with 2FA
// enabled; exchanged (with a TOTP code) for a real session. It is signed with
// a key derived from AUTH_SECRET, NOT AUTH_SECRET itself, so it can never be
// accepted as an access token by verifyAccessToken.
const twoFactorLoginSecret: Secret = createHmac("sha256", AUTH_SECRET)
  .update("two-factor-login-challenge")
  .digest("hex");
const TWO_FACTOR_LOGIN_PURPOSE = "2fa_login";

export const generateTwoFactorLoginToken = (payload: { id: string; token_version: number }) =>
  jwt.sign({ ...payload, purpose: TWO_FACTOR_LOGIN_PURPOSE }, twoFactorLoginSecret, { expiresIn: "5m" });

export const verifyTwoFactorLoginToken = (token: string) => {
  const decoded = jwt.verify(token, twoFactorLoginSecret) as {
    id?: string;
    token_version?: number;
    purpose?: string;
  };
  if (decoded.purpose !== TWO_FACTOR_LOGIN_PURPOSE || !decoded.id) {
    throw new Error("Invalid two-factor login token");
  }
  return { id: decoded.id, token_version: decoded.token_version };
};
