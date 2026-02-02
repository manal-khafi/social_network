"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.toggleRepost = void 0;
const prismaClient_1 = __importDefault(require("../../config/prismaClient"));
const BlockService_1 = require("../../Service/BlockService");
const notificationService_1 = require("../../Service/notificationService");
const notificationRealtime_1 = require("../../Service/notificationRealtime");
const toggleRepost = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { postId } = req.params;
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
        const existingRepost = await prismaClient_1.default.repost.findFirst({
            where: { user_id: userId, original_post_id: postId },
        });
        if (existingRepost) {
            await prismaClient_1.default.repost.delete({ where: { id: existingRepost.id } });
            const updatedPost = await prismaClient_1.default.post.findUnique({
                where: { id: postId },
                include: { _count: { select: { reposts: true, shares: true } } }
            });
            return res.json({
                reposted: false,
                shares: (updatedPost?._count.reposts ?? 0) + (updatedPost?._count.shares ?? 0)
            });
        }
        await prismaClient_1.default.repost.create({
            data: { user_id: userId, original_post_id: postId },
        });
        // Notify post owner
        if (post.user_id && post.user_id !== userId) {
            try {
                const notif = await (0, notificationService_1.createNotification)({
                    userId: post.user_id,
                    code: "POST_REPOSTED",
                    title: "Post reposted",
                    message: "reposted your post",
                    senderId: userId,
                    sourceId: postId,
                    sourceType: "post",
                    metadata: { postId },
                });
                await (0, notificationRealtime_1.emitNotificationNew)({
                    receiverId: post.user_id,
                    kind: "repost",
                    notification: notif,
                    extra: { postId },
                });
            }
            catch {
                // ignore
            }
        }
        const updatedPost = await prismaClient_1.default.post.findUnique({
            where: { id: postId },
            include: { _count: { select: { reposts: true, shares: true } } }
        });
        return res.json({
            reposted: true,
            shares: (updatedPost?._count.reposts ?? 0) + (updatedPost?._count.shares ?? 0)
        });
    }
    catch (error) {
        return res.status(500).json({ message: "Something went wrong" });
    }
};
exports.toggleRepost = toggleRepost;
