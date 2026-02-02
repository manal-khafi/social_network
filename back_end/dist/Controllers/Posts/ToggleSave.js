"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.toggleSave = void 0;
const prismaClient_1 = __importDefault(require("../../config/prismaClient"));
const BlockService_1 = require("../../../src/Service/BlockService");
const toggleSave = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { postId } = req.params;
        if (typeof postId !== 'string') {
            return res.status(400).json({ message: "Invalid post ID" });
        }
        if (!userId) {
            return res.status(401).json({ message: "Non authentifié" });
        }
        const post = await prismaClient_1.default.post.findUnique({ where: { id: postId } });
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }
        // Check if the viewer is blocked by the post owner, or vice versa
        if (await (0, BlockService_1.isBlockedEitherWay)(userId, post.user_id)) {
            return res.status(403).json({ message: "Forbidden" });
        }
        const existingSave = await prismaClient_1.default.save.findFirst({
            where: { user_id: userId, post_id: postId },
        });
        if (existingSave) {
            await prismaClient_1.default.save.delete({ where: { id: existingSave.id } });
            const updatedPost = await prismaClient_1.default.post.findUnique({
                where: { id: postId },
                select: { _count: { select: { saves: true } } }
            });
            return res.json({ saved: false, saves: updatedPost?._count.saves ?? 0 });
        }
        await prismaClient_1.default.save.create({
            data: { user_id: userId, post_id: postId },
        });
        const updatedPost = await prismaClient_1.default.post.findUnique({
            where: { id: postId },
            select: { _count: { select: { saves: true } } }
        });
        return res.json({ saved: true, saves: updatedPost?._count.saves ?? 0 });
    }
    catch (error) {
        return res.status(500).json({ message: "Something went wrong" });
    }
};
exports.toggleSave = toggleSave;
