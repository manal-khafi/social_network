"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPassword = exports.verifyResetToken = exports.forgotPassword = void 0;
const prismaClient_1 = __importDefault(require("../config/prismaClient"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const EempleEmail_1 = require("../util/EempleEmail");
const RESET_SECRET_RAW = process.env.RESET_PASSWORD_SECRET;
if (!RESET_SECRET_RAW)
    throw new Error("RESET_PASSWORD_SECRET is not defined");
const RESET_SECRET = RESET_SECRET_RAW;
const parseTime_1 = require("../util/parseTime");
const signOptions = {
    expiresIn: (0, parseTime_1.parseTimeString)(process.env.RESET_PASSWORD_EXPIRES_IN || "15m"),
    algorithm: "HS256",
};
const forgotPassword = async (email) => {
    const user = await prismaClient_1.default.user.findUnique({ where: { email } });
    if (!user)
        throw new Error("No user found with this email");
    const resetToken = jsonwebtoken_1.default.sign({ userId: user.id, email: user.email }, RESET_SECRET, signOptions);
    await (0, EempleEmail_1.sendResetPasswordEmail)(email, resetToken);
    console.log("Reset password token sent");
};
exports.forgotPassword = forgotPassword;
const verifyResetToken = async (token) => {
    try {
        return jsonwebtoken_1.default.verify(token, RESET_SECRET);
    }
    catch {
        return null;
    }
};
exports.verifyResetToken = verifyResetToken;
const resetPassword = async (token, newPassword) => {
    let payload;
    try {
        payload = jsonwebtoken_1.default.verify(token, RESET_SECRET);
    }
    catch {
        throw new Error("Token invalide ou expiré");
    }
    const hashedPassword = await bcrypt_1.default.hash(newPassword, 10);
    await prismaClient_1.default.user.update({
        where: { id: payload.userId },
        data: { password_hash: hashedPassword },
    });
    console.log("Password reset successful");
};
exports.resetPassword = resetPassword;
