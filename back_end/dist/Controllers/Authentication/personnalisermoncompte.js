"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfile = void 0;
const prismaClient_1 = __importDefault(require("../../config/prismaClient"));
const updateProfile = async (req, res) => {
    try {
        const { id } = req.params;
        const { avatar_url, gender, account_name, date_of_birth, bio } = req.body;
        const user = await prismaClient_1.default.user.findUnique({ where: { id } });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        const updatedUser = await prismaClient_1.default.user.update({
            where: { id },
            data: {
                avatar_url: avatar_url ?? user.avatar_url,
                gender: gender ?? user.gender,
                account_name: account_name ?? user.account_name,
                date_of_birth: date_of_birth ? new Date(date_of_birth) : user.date_of_birth,
                bio: bio ?? user.bio,
                updated_at: new Date(),
            },
        });
        return res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            user: updatedUser,
        });
    }
    catch (error) {
        console.error("Error updating profile:", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};
exports.updateProfile = updateProfile;
