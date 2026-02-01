"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const getCommunityMembers = async (req, res, next) => {
    const communityId = req.params.communityId;
    if (typeof communityId !== 'string') {
        return res.status(400).json({ message: "Invalid community ID" });
    }
    try {
        const members = await prisma.communityMember.findMany({
            where: { community_id: communityId },
            include: { user: true },
        });
        res.status(200).json({ members });
    }
    catch (error) {
        next(error);
    }
};
const giveMemberRole = async (req, res, next) => {
    const { role } = req.body;
    const communityId = req.params.communityId;
    const userId = req.params.userId;
    if (typeof communityId !== 'string' || typeof userId !== 'string') {
        return res.status(400).json({ message: "Invalid ID" });
    }
    try {
        const updatedMember = await prisma.communityMember.updateMany({
            where: {
                community_id: communityId,
                user_id: userId,
            },
            data: {
                role_id: role,
            },
        });
        res.status(200).json({ member: updatedMember });
    }
    catch (error) {
        next(error);
    }
};
const getOneCommunityMember = async (req, res, next) => {
    const communityId = req.params.communityId;
    const userId = req.params.userId;
    if (typeof communityId !== 'string' || typeof userId !== 'string') {
        return res.status(400).json({ message: "Invalid ID" });
    }
    try {
        const member = await prisma.communityMember.findFirst({
            where: {
                community_id: communityId,
                user_id: userId,
            },
            include: { user: true },
        });
        res.status(200).json({ member });
    }
    catch (error) {
        next(error);
    }
};
const DeleteCommunityMember = async (req, res, next) => {
    const communityId = req.params.communityId;
    const userId = req.params.userId;
    if (typeof communityId !== 'string' || typeof userId !== 'string') {
        return res.status(400).json({ message: "Invalid ID" });
    }
    try {
        const deletedMember = await prisma.communityMember.deleteMany({
            where: {
                community_id: communityId,
                user_id: userId,
            },
        });
        res.status(200).json({ member: deletedMember });
    }
    catch (error) {
        next(error);
    }
};
const checkMembershipStatus = async (req, res, next) => {
    const communityId = req.params.communityId;
    const userId = req.params.userId;
    if (typeof communityId !== 'string' || typeof userId !== 'string') {
        return res.status(400).json({ message: "Invalid ID" });
    }
    try {
        const member = await prisma.communityMember.findFirst({
            where: {
                community_id: communityId,
                user_id: userId,
                status: 'active',
            },
        });
        res.status(200).json({
            status: "success",
            isMember: !!member,
            member: member || null,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.default = {
    getCommunityMembers,
    giveMemberRole,
    getOneCommunityMember,
    DeleteCommunityMember,
    checkMembershipStatus,
};
