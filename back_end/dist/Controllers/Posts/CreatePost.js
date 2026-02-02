"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPost = void 0;
const prismaClient_1 = __importDefault(require("../../config/prismaClient"));
const notificationService_1 = require("../../Service/notificationService");
const notificationRealtime_1 = require("../../Service/notificationRealtime");
const extractMentions = (text) => {
    const out = new Set();
    const re = /@([a-zA-Z0-9_]{2,30})/g;
    let m;
    while ((m = re.exec(text))) {
        out.add(m[1]);
    }
    return Array.from(out);
};
const createPost = async (req, res) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({ message: "Non authentifié" });
        }
        const { content, media_urls, visibility } = req.body;
        if (!content || typeof content !== "string" || content.trim().length === 0) {
            return res.status(400).json({ message: "Content is required and cannot be empty" });
        }
        if (media_urls && !Array.isArray(media_urls)) {
            return res.status(400).json({ message: "media_urls must be an array of strings" });
        }
        if (media_urls && !media_urls.every((m) => typeof m === "string")) {
            return res.status(400).json({ message: "Each media URL must be a string" });
        }
        const allowedVisibilities = ["public", "private", "friends"];
        if (visibility && !allowedVisibilities.includes(visibility)) {
            return res.status(400).json({ message: "Invalid visibility value" });
        }
        const post = await prismaClient_1.default.post.create({
            data: {
                content: content.trim(),
                media_urls: media_urls ?? null,
                visibility: (visibility || "public"),
                user_id: req.user.id,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        display_name: true,
                        avatar_url: true,
                    },
                },
                _count: {
                    select: {
                        likes: true,
                        comments: true,
                        shares: true,
                        saves: true,
                    },
                },
            },
        });
        const normalizedPost = {
            id: post.id,
            userId: post.user_id,
            username: post.user.username || post.user.display_name || "Unknown User",
            avatar: post.user.avatar_url ?? undefined,
            content: post.content ?? "",
            images: post.media_urls ?? undefined,
            likes: post._count.likes ?? 0,
            comments: post._count.comments ?? 0,
            shares: post._count.shares ?? 0,
            saves: post._count.saves ?? 0,
            isLiked: false,
            isSaved: false,
            isReposted: false,
            isArchived: false,
            isEdited: false,
            timestamp: post.created_at.toISOString(),
            commentsAllowed: true,
            likesVisible: true,
        };
        // Mentions inside post content
        try {
            const mentions = extractMentions(content);
            if (mentions.length) {
                const sender = post.user;
                const senderName = sender.display_name || sender.username || "Someone";
                const mentionedUsers = await prismaClient_1.default.user.findMany({
                    where: { username: { in: mentions } },
                    select: { id: true },
                });
                for (const u of mentionedUsers) {
                    if (u.id === req.user.id)
                        continue;
                    const notif = await (0, notificationService_1.createNotification)({
                        userId: u.id,
                        code: "POST_MENTION",
                        title: "Mention",
                        message: `${senderName} mentioned you in a post`,
                        senderId: req.user.id,
                        sourceId: post.id,
                        sourceType: "post",
                        metadata: { postId: post.id },
                    });
                    await (0, notificationRealtime_1.emitNotificationNew)({
                        receiverId: u.id,
                        kind: "mention",
                        notification: notif,
                        extra: { postId: post.id },
                    });
                }
            }
        }
        catch {
            // ignore
        }
        return res
            .status(201)
            .json({ message: "Post created successfully", post: normalizedPost });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Server error while creating post" });
    }
};
exports.createPost = createPost;
