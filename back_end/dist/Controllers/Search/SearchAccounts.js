"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchAccounts = void 0;
const prismaClient_1 = __importDefault(require("../../config/prismaClient"));
const jwt_1 = require("../../util/jwt");
const BlockService_1 = require("../../Service/BlockService");
const searchAccounts = async (req, res) => {
    try {
        const rawQuery = String(req.query.q ?? "").trim();
        if (!rawQuery) {
            return res.status(200).json({ accounts: [] });
        }
        const limitParam = Number(req.query.limit);
        const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 50) : 20;
        const authHeader = req.headers.authorization;
        let viewerId = null;
        if (authHeader && authHeader.startsWith("Bearer ")) {
            const token = authHeader.split(" ")[1];
            try {
                const decoded = (0, jwt_1.verifyAccessToken)(token);
                viewerId = decoded.id;
            }
            catch {
                viewerId = null;
            }
        }
        const blockedIds = viewerId ? await (0, BlockService_1.getBlockedUserIds)(viewerId) : [];
        let followingIds = new Set();
        let pendingIds = new Set();
        if (viewerId) {
            const follows = await prismaClient_1.default.follow.findMany({
                where: { follower_id: viewerId, status: { in: ["accepted", "pending"] } },
                select: { followed_id: true, status: true },
            });
            follows.forEach((f) => {
                if (f.status === "accepted")
                    followingIds.add(f.followed_id);
                if (f.status === "pending")
                    pendingIds.add(f.followed_id);
            });
        }
        const users = await prismaClient_1.default.user.findMany({
            where: {
                is_active: true,
                id: blockedIds.length > 0 ? { notIn: blockedIds } : undefined,
                OR: [
                    { username: { contains: rawQuery, mode: "insensitive" } },
                    { display_name: { contains: rawQuery, mode: "insensitive" } },
                ],
            },
            select: {
                id: true,
                username: true,
                display_name: true,
                avatar_url: true,
                is_private: true,
            },
            take: limit * 2,
            orderBy: { username: "asc" },
        });
        const accounts = users
            .map((u) => ({
            id: u.id,
            username: u.username,
            display_name: u.display_name,
            avatar_url: u.avatar_url,
            is_private: u.is_private,
            isFollowing: viewerId ? followingIds.has(u.id) : false,
            followRequestPending: viewerId ? pendingIds.has(u.id) : false,
        }))
            .sort((a, b) => {
            const rankA = a.isFollowing ? 2 : a.followRequestPending ? 1 : 0;
            const rankB = b.isFollowing ? 2 : b.followRequestPending ? 1 : 0;
            if (rankA !== rankB)
                return rankB - rankA;
            return a.username.localeCompare(b.username);
        })
            .slice(0, limit);
        return res.status(200).json({ accounts });
    }
    catch (error) {
        return res.status(500).json({ message: "Server error while searching accounts" });
    }
};
exports.searchAccounts = searchAccounts;
