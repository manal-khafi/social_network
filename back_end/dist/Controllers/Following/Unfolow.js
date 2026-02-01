"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const prismaClient_1 = __importDefault(require("../../config/prismaClient"));
const BlockService_1 = require("../../services/BlockService");
const Unfollow = async (req, res) => {
    try {
        const userIdToUnfollow = req.params.userIdToUnfollow;
        if (typeof userIdToUnfollow !== 'string') {
            return res.status(400).json({ message: "Invalid user ID" });
        }
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const userToUnfollow = await prismaClient_1.default.user.findUnique({
            where: { id: userIdToUnfollow }
        });
        if (!userToUnfollow) {
            return res.status(404).json({ message: "User to unfollow not found" });
        }
        // Check if either user has blocked the other
        if (await (0, BlockService_1.isBlockedEitherWay)(userId, userIdToUnfollow)) {
            return res.status(403).json({ message: "Forbidden" });
        }
        const existingFollow = await prismaClient_1.default.follow.findFirst({
            where: {
                follower_id: userId,
                followed_id: userIdToUnfollow,
                status: "accepted"
            }
        });
        if (!existingFollow) {
            return res.status(400).json({ message: "You are not following this user or request not accepted" });
        }
        await prismaClient_1.default.follow.delete({
            where: { id: existingFollow.id }
        });
        res.status(200).json({ message: "Successfully unfollowed the user" });
    }
    catch (error) {
        res.status(500).json({ message: "Internal Server Error" });
    }
};
exports.default = Unfollow;
