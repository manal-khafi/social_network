"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logout = void 0;
const Logout = async (req, res) => {
    try {
        res.clearCookie("refreshToken", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
        });
        return res.status(200).json({
            success: true,
            message: "Logged out successfully",
        });
    }
    catch (error) {
        console.error("Logout error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error during logout",
        });
    }
};
exports.Logout = Logout;
