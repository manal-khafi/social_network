"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const prismaClient_1 = __importDefault(require("../../config/prismaClient"));
const jwt_1 = require("../../util/jwt");
const verifyEmail = async (req, res) => {
    try {
        const { token } = req.query;
        if (!token || typeof token !== "string") {
            return res.status(400).json({ success: false, message: "Token is missing!" });
        }
        const decoded = (0, jwt_1.verifyEmailVerifyToken)(token);
        const user = await prismaClient_1.default.user.findUnique({ where: { id: decoded.userId } });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found!" });
        }
        if (user.is_verified) {
            return res.json({ success: true, message: "Your email is already verified! You can log in." });
        }
        await prismaClient_1.default.user.update({
            where: { id: user.id },
            data: { is_verified: true },
        });
        return res.json({ success: true, message: "Your email has been verified! You can now log in." });
    }
    catch (error) {
        console.error("Verification error:", error);
        return res.status(500).json({ success: false, message: "Server error", detail: error.message });
    }
};
exports.default = verifyEmail;
