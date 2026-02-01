"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.forgotPasswordController = void 0;
const authService_1 = require("../../services/authService");
const forgotPasswordController = async (req, res) => {
    console.log("✅ FORGOT PASSWORD ENDPOINT HIT");
    console.log("BODY:", req.body);
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ success: false, message: "Email is required" });
    }
    try {
        await (0, authService_1.forgotPassword)(email);
        return res.status(200).json({
            success: true,
            message: "Password reset email sent! Check your inbox.",
        });
    }
    catch (err) {
        console.error("🔥 FORGOT PASSWORD ERROR 🔥");
        console.error(err);
        console.error(err?.message);
        console.error(err?.stack);
        return res.status(500).json({
            success: false,
            message: err?.message || "Server error",
        });
    }
};
exports.forgotPasswordController = forgotPasswordController;
