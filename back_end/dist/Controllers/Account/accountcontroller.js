"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAccount = exports.deactivateAccount = exports.changePassword = void 0;
const prismaClient_1 = __importDefault(require("../../config/prismaClient"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const changePassword = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, message: "Not authenticated" });
        }
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ success: false, message: "currentPassword and newPassword are required" });
        }
        const user = await prismaClient_1.default.user.findUnique({
            where: { id: userId },
            select: { id: true, password_hash: true },
        });
        if (!user || !user.password_hash) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        const ok = await bcrypt_1.default.compare(currentPassword, user.password_hash);
        if (!ok) {
            return res.status(401).json({ success: false, message: "Incorrect current password" });
        }
        const hashed = await bcrypt_1.default.hash(newPassword, 10);
        await prismaClient_1.default.user.update({
            where: { id: userId },
            data: { password_hash: hashed },
        });
        return res.status(200).json({ success: true, message: "Password updated" });
    }
    catch (error) {
        console.error("changePassword error:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};
exports.changePassword = changePassword;
const deactivateAccount = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, message: "Not authenticated" });
        }
        const { password, reason } = req.body;
        if (!password) {
            return res.status(400).json({ success: false, message: "password is required" });
        }
        if (!reason || !reason.trim()) {
            return res.status(400).json({ success: false, message: "reason is required" });
        }
        const user = await prismaClient_1.default.user.findUnique({
            where: { id: userId },
            select: { id: true, password_hash: true },
        });
        if (!user || !user.password_hash) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        const ok = await bcrypt_1.default.compare(password, user.password_hash);
        if (!ok) {
            return res.status(401).json({ success: false, message: "Incorrect password" });
        }
        await prismaClient_1.default.user.update({
            where: { id: userId },
            data: {
                is_active: false,
            },
        });
        return res.status(200).json({ success: true, message: "Account deactivated" });
    }
    catch (error) {
        console.error("deactivateAccount error:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};
exports.deactivateAccount = deactivateAccount;
const deleteAccount = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, message: "Not authenticated" });
        }
        const { password, reason } = req.body;
        if (!password) {
            return res.status(400).json({ success: false, message: "password is required" });
        }
        if (!reason || !reason.trim()) {
            return res.status(400).json({ success: false, message: "reason is required" });
        }
        const user = await prismaClient_1.default.user.findUnique({
            where: { id: userId },
            select: { id: true, password_hash: true },
        });
        if (!user || !user.password_hash) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        const ok = await bcrypt_1.default.compare(password, user.password_hash);
        if (!ok) {
            return res.status(401).json({ success: false, message: "Incorrect password" });
        }
        await prismaClient_1.default.user.delete({ where: { id: userId } });
        return res.status(200).json({ success: true, message: "Account deleted" });
    }
    catch (error) {
        console.error("deleteAccount error:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};
exports.deleteAccount = deleteAccount;
