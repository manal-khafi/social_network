import { Request, Response, NextFunction } from "express";
import prisma from "../../config/prismaClient";
import { requireCommunityAdmin } from "./communityAccess";


const createCommunity = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name, bio, image, type, avatar } = req.body;
        
        if (!name || !bio) {
            return res.status(400).json({
                status: "error",
                message: "Name and bio are required",
            });
        }
        
        const created_by = req.user?.id;

        if (!created_by) {
            return res.status(401).json({
                status: "error",
                message: "Not authenticated",
            });
        }
        
        // Find or create OWNER/ADMIN role
        let ownerRole = await prisma.role.findFirst({
            where: { name: "OWNER" }
        });

        if (!ownerRole) {
            ownerRole = await prisma.role.findFirst({
                where: { name: "ADMIN" }
            });
        }

        const community = await prisma.community.create({
            data: {
                name,
                description: bio,
                avatar_url: avatar || null,
                banner_url: image || null, 
                is_private: false,
                created_by,
                type: type || "other",
                // Add creator as a member with OWNER/ADMIN role
                members: {
                    create: {
                        user_id: created_by,
                        role_id: ownerRole?.id,
                        status: "active"
                    }
                }
            },
            include: {
                members: true,
                _count: {
                    select: { members: true }
                }
            }
        });

        res.status(201).json({
            status: "success",
            message: "Community created",
            data: community,
        });
    } catch (error: any) {
        console.error("Error creating community:", error);
        
        if (error.code === 'P2002' && error.meta?.target?.includes('name')) {
            return res.status(400).json({
                status: "error",
                message: "A community with this name already exists. Choose another name.",
            });
        }
        
        res.status(500).json({
            status: "error",
            message: error.message || "Failed to create the community",
        });
    }
}

const getAllCommunities = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const communities = await prisma.community.findMany({
            include: {
                _count: {
                    select: { members: true }
                }
            }
        });
        res.status(200).json({
            status: "success",
            data: communities,
        });
    } catch (error) {
        res.status(500).json({
            status: "error",
            message: "Failed to load communities",
        });
    }
}

const getCommunityById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params as { [key: string]: string };
        const community = await prisma.community.findUnique({
            where: { id: id },
            include: {
                _count: {
                    select: { members: true }
                }
            }
        });

        if (!community) {
            return res.status(404).json({
                status: "error",
                message: "Community not found",
            });
        }

        res.status(200).json({
            status: "success",
            data: community,
        });
    } catch (error) {
        res.status(500).json({
            status: "error",
            message: "Failed to load the community",
        });
    }
}

const modifyCommunity = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params as { [key: string]: string };
        const { name, description, bio, banner_url, avatar_url, is_private, type } = req.body;

        const access = await requireCommunityAdmin(req, res, id);
        if (!access) return;

        // Build update object with only provided fields
        const updateData: any = {};
        if (name) updateData.name = name;
        if (description) updateData.description = description;
        if (bio) updateData.description = bio; // Map bio to description in database
        if (banner_url) updateData.banner_url = banner_url;
        if (avatar_url) updateData.avatar_url = avatar_url;
        if (is_private !== undefined) updateData.is_private = Boolean(is_private);
        if (type) updateData.type = type;
        
        const updatedCommunity = await prisma.community.update({
            where: { id: id },
            data: updateData,
        });

        res.status(200).json({
            status: "success",
            data: updatedCommunity,
        });
    } catch (error: any) {
        console.error("Error updating community:", error);
        
        if (error.code === 'P2025') {
            return res.status(404).json({
                status: "error",
                message: "Community not found",
            });
        }
        
        res.status(500).json({
            status: "error",
            message: "Failed to update the community",
        });
    }
}

const deleteCommunity = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params as { [key: string]: string };

        const access = await requireCommunityAdmin(req, res, id);
        if (!access) return;

        await prisma.community.delete({
            where: { id: id },
        });

        res.status(200).json({
            status: "success",
            message: "Community deleted",
        });
    } catch (error) {
        res.status(500).json({
            status: "error",
            message: "Failed to delete the community",
        });
    }
}


export default { createCommunity, getAllCommunities, getCommunityById, modifyCommunity, deleteCommunity };