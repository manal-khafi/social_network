"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.unarchivePost = exports.archivePost = void 0;
const prismaClient_1 = __importDefault(require("../../config/prismaClient"));
const archivePost = async (req, res) => {
    const { postId } = req.params;
    const userId = req.user?.id;
    if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    try {
        const post = await prismaClient_1.default.post.findUnique({
            where: { id: postId },
        });
        if (!post || post.user_id !== userId) {
            return res.status(404).json({ message: "Post not found or not owned" });
        }
        await prismaClient_1.default.post.update({
            where: { id: postId },
            data: { is_archived: true },
        });
        res.json({ success: true, postId });
    }
    catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
};
exports.archivePost = archivePost;
const unarchivePost = async (req, res) => {
    const { postId } = req.params;
    const userId = req.user?.id;
    if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    try {
        const post = await prismaClient_1.default.post.findUnique({
            where: { id: postId },
        });
        if (!post || post.user_id !== userId) {
            return res.status(404).json({ message: "Post not found or not owned" });
        }
        await prismaClient_1.default.post.update({
            where: { id: postId },
            data: { is_archived: false },
        });
        res.json({ success: true, postId });
    }
    catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
};
exports.unarchivePost = unarchivePost;
