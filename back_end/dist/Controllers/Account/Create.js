"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const prismaClient_1 = __importDefault(require("../../config/prismaClient"));
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const crypto_1 = __importDefault(require("crypto"));
const firebaseStorage_1 = require("../../util/firebaseStorage");
const Create = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        if (!req.body.userData) {
            return res.status(400).json({ message: "Missing userData" });
        }
        let userData;
        try {
            userData = JSON.parse(req.body.userData);
        }
        catch {
            return res.status(400).json({ message: "Invalid userData (JSON)" });
        }
        const { profile, privacy } = userData;
        if (!profile?.username || profile.username.length < 3) {
            return res.status(400).json({
                message: "Invalid username (minimum 3 characters)",
            });
        }
        if (profile.gender &&
            !["male", "female", "prefer_not_say"].includes(profile.gender)) {
            return res.status(400).json({ message: "Invalid gender" });
        }
        let avatarUrl = null;
        if (req.file) {
            if (!req.file.mimetype.startsWith("image/")) {
                return res
                    .status(400)
                    .json({ message: "File must be an image" });
            }
            if (req.file.size > 5 * 1024 * 1024) {
                return res
                    .status(400)
                    .json({ message: "Image too large (max 5MB)" });
            }
            const mimetype = String(req.file.mimetype || "image/png");
            const ext = mimetype.includes("jpeg") || mimetype.includes("jpg") ? "jpg" : mimetype.includes("webp") ? "webp" : "png";
            const rand = crypto_1.default.randomBytes(8).toString("hex");
            try {
                const objectPath = `avatars/${userId}/${Date.now()}-${rand}.${ext}`;
                const uploaded = await (0, firebaseStorage_1.uploadBufferToFirebaseStorage)({
                    objectPath,
                    buffer: req.file.buffer,
                    contentType: mimetype,
                    cacheControl: "public, max-age=86400",
                });
                avatarUrl = uploaded.url;
            }
            catch {
                const avatarFileName = `${userId}.${ext}`;
                const avatarDir = path_1.default.join(__dirname, "../../../uploads/avatars");
                await fs_1.promises.mkdir(avatarDir, { recursive: true });
                const avatarPath = path_1.default.join(avatarDir, avatarFileName);
                await fs_1.promises.writeFile(avatarPath, req.file.buffer);
                avatarUrl = `/uploads/avatars/${avatarFileName}`;
            }
        }
        const updatedUser = await prismaClient_1.default.user.update({
            where: { id: userId },
            data: {
                username: profile.username,
                display_name: profile.displayName || profile.username,
                bio: profile.bio || null,
                gender: profile.gender || null,
                is_private: privacy?.type === "private",
                avatar_url: avatarUrl,
            },
        });
        return res.status(200).json({
            success: true,
            message: "Profile successfully completed",
            user: {
                updatedUser,
            },
        });
    }
    catch (error) {
        console.error("Profile update error:", error);
        if (error.code === "P2002") {
            return res.status(409).json({
                message: "Username already in use",
            });
        }
        return res.status(500).json({
            message: "Server error while updating profile",
        });
    }
};
exports.default = Create;
