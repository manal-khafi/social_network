"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OnboardingComplete = void 0;
const prismaClient_1 = __importDefault(require("../../config/prismaClient"));
const OnboardingComplete = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Not authenticated",
            });
        }
        const updatedUser = await prismaClient_1.default.user.update({
            where: { id: req.user.id },
            data: { onboarding_done: true },
        });
        return res.status(200).json({
            success: true,
            user: {
                id: updatedUser.id,
                email: updatedUser.email,
                username: updatedUser.username,
                role: updatedUser.role_id,
                onboarding_done: updatedUser.onboarding_done,
            },
        });
    }
    catch (error) {
        console.error("Onboarding complete error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};
exports.OnboardingComplete = OnboardingComplete;
