"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyEmailVerifyToken = exports.generateEmailVerifyToken = exports.verifyResetToken = exports.generateResetToken = exports.verifyRefreshToken = exports.generateRefreshToken = exports.verifyAccessToken = exports.generateAccessToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const { AUTH_SECRET, AUTH_SECRET_EXPIRES_IN, AUTH_REFRESH_SECRET, AUTH_REFRESH_SECRET_EXPIRES_IN, RESET_SECRET, RESET_EXPIRES_IN, EMAIL_VERIFY_SECRET, EMAIL_VERIFY_EXPIRES_IN } = process.env;
if (!AUTH_SECRET || !AUTH_REFRESH_SECRET || !RESET_SECRET || !EMAIL_VERIFY_SECRET) {
    throw new Error("JWT secrets are missing in environment variables!");
}
const accessSecret = AUTH_SECRET;
const refreshSecret = AUTH_REFRESH_SECRET;
const resetSecret = RESET_SECRET;
const accessExpiresIn = AUTH_SECRET_EXPIRES_IN ?? "15m";
const refreshExpiresIn = AUTH_REFRESH_SECRET_EXPIRES_IN ?? "24h";
const resetExpiresIn = RESET_EXPIRES_IN ?? "15m";
const emailVerifySecret = EMAIL_VERIFY_SECRET;
const emailVerifyExpiresIn = EMAIL_VERIFY_EXPIRES_IN ?? "24h";
// Generate access token
const generateAccessToken = (payload) => jsonwebtoken_1.default.sign(payload, accessSecret, { expiresIn: accessExpiresIn });
exports.generateAccessToken = generateAccessToken;
// Verify access token
const verifyAccessToken = (token) => jsonwebtoken_1.default.verify(token, accessSecret);
exports.verifyAccessToken = verifyAccessToken;
// Generate refresh token
const generateRefreshToken = (payload) => jsonwebtoken_1.default.sign(payload, refreshSecret, { expiresIn: refreshExpiresIn });
exports.generateRefreshToken = generateRefreshToken;
// Verify refresh token
const verifyRefreshToken = (token) => jsonwebtoken_1.default.verify(token, refreshSecret);
exports.verifyRefreshToken = verifyRefreshToken;
// Generate reset password token
const generateResetToken = (payload) => jsonwebtoken_1.default.sign(payload, resetSecret, { expiresIn: resetExpiresIn });
exports.generateResetToken = generateResetToken;
// Verify reset token
const verifyResetToken = (token) => jsonwebtoken_1.default.verify(token, resetSecret);
exports.verifyResetToken = verifyResetToken;
// Generate email verification token
const generateEmailVerifyToken = (payload) => jsonwebtoken_1.default.sign(payload, emailVerifySecret, { expiresIn: emailVerifyExpiresIn });
exports.generateEmailVerifyToken = generateEmailVerifyToken;
// Verify email verification token
const verifyEmailVerifyToken = (token) => jsonwebtoken_1.default.verify(token, emailVerifySecret);
exports.verifyEmailVerifyToken = verifyEmailVerifyToken;
// console.log("DEBUG SECRET:", process.env.AUTH_SECRET);
