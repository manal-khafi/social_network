import { Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();


const createCommunity = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name, bio, image, type, avatar } = req.body;
        
        if (!name || !bio) {
            return res.status(400).json({
                status: "error",
                message: "Name and bio are required",
            });
        }
        
        let created_by = (req as any).user?.id;
        
        if (!created_by) {
            const firstUser = await prisma.user.findFirst();
            if (!firstUser) {
                return res.status(400).json({
                    status: "error",
                    message: "No user found in database. Please create a user first.",
                });
            }
            created_by = firstUser.id;
        }
        
        const community = await prisma.community.create({
            data: {
                name,
                description: bio,
                avatar_url: avatar || null,
                banner_url: image || null, 
                is_private: false,
                created_by,
                type: type || "other"
            },
        });

        res.status(201).json({
            status: "success",
            message: "Communauté créée avec succès",
            data: community,
        });
    } catch (error: any) {
        console.error("Error creating community:", error);
        
        if (error.code === 'P2002' && error.meta?.target?.includes('name')) {
            return res.status(400).json({
                status: "error",
                message: "Un community avec ce nom existe déjà. Choisissez un autre nom.",
            });
        }
        
        res.status(500).json({
            status: "error",
            message: error.message || "Erreur lors de la création de la communauté",
        });
    }
}

const getAllCommunities = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const communities = await prisma.community.findMany();
        res.status(200).json({
            status: "success",
            data: communities,
        });
    } catch (error) {
        res.status(500).json({
            status: "error",
            message: "Erreur lors de la récupération des communautés",
        });
    }
}

const getCommunityById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const community = await prisma.community.findUnique({
            where: { id: id },
        });

        if (!community) {
            return res.status(404).json({
                status: "error",
                message: "Communauté non trouvée",
            });
        }

        res.status(200).json({
            status: "success",
            data: community,
        });
    } catch (error) {
        res.status(500).json({
            status: "error",
            message: "Erreur lors de la récupération de la communauté",
        });
    }
}

const modifyCommunity = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { name, description, bio, banner_url, avatar_url, is_private } = req.body;
        
        // Build update object with only provided fields
        const updateData: any = {};
        if (name) updateData.name = name;
        if (description) updateData.description = description;
        if (bio) updateData.description = bio; // Map bio to description in database
        if (banner_url) updateData.banner_url = banner_url;
        if (avatar_url) updateData.avatar_url = avatar_url;
        if (is_private !== undefined) updateData.is_private = Boolean(is_private);
        
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
                message: "Communauté non trouvée",
            });
        }
        
        res.status(500).json({
            status: "error",
            message: "Erreur lors de la modification de la communauté",
        });
    }
}

const deleteCommunity = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        await prisma.community.delete({
            where: { id: id },
        });

        res.status(200).json({
            status: "success",
            message: "Communauté supprimée avec succès",
        });
    } catch (error) {
        res.status(500).json({
            status: "error",
            message: "Erreur lors de la suppression de la communauté",
        });
    }
}


export default { createCommunity, getAllCommunities, getCommunityById, modifyCommunity, deleteCommunity };