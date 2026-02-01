"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const prismaClient_1 = __importDefault(require("../../config/prismaClient"));
const BlockService_1 = require("../../services/BlockService");
const Follow = async (req, res) => {
    try {
        const userIdToFollow = req.params.userIdToFollow; // déjà string
        if (typeof userIdToFollow !== 'string') {
            return res.status(400).json({ message: "Invalid user ID" });
        }
        const userId = req.user?.id; // Auth user (string UUID)
        // 1️⃣ Vérifier que l’utilisateur est authentifié
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        // 2️⃣ Vérifier si l’utilisateur à suivre existe
        const userToFollow = await prismaClient_1.default.user.findUnique({
            where: { id: userIdToFollow }
        });
        if (!userToFollow) {
            return res.status(404).json({ message: "User to follow not found" });
        }
        // Check if either user has blocked the other
        if (await (0, BlockService_1.isBlockedEitherWay)(userId, userIdToFollow)) {
            return res.status(403).json({ message: "Forbidden" });
        }
        // 3️⃣ Vérifier qu’on ne follow pas soi-même
        if (userId === userIdToFollow) {
            return res.status(400).json({ message: "You cannot follow yourself" });
        }
        // 4️⃣ Vérifier si la relation existe déjà avec status accepted
        const alreadyFollowing = await prismaClient_1.default.follow.findFirst({
            where: {
                follower_id: userId,
                followed_id: userIdToFollow,
                status: "accepted" // 👈 uniquement accepted
            }
        });
        if (alreadyFollowing) {
            return res.status(400).json({ message: "Already following this user" });
        }
        // 5️⃣ Si le compte est privé → request pending
        if (userToFollow.is_private === true) {
            await prismaClient_1.default.follow.create({
                data: {
                    follower_id: userId,
                    followed_id: userIdToFollow,
                    status: "pending"
                }
            });
            return res.status(201).json({ message: "Follow request sent", status: "PENDING" });
        }
        // 6️⃣ Sinon follow direct → accepted
        await prismaClient_1.default.follow.create({
            data: {
                follower_id: userId,
                followed_id: userIdToFollow,
                status: "accepted"
            }
        });
        return res.status(201).json({ message: "Successfully followed the user", status: "ACCEPTED" });
    }
    catch (error) {
        res.status(500).json({ message: "Internal Server Error", error });
    }
};
exports.default = Follow;
