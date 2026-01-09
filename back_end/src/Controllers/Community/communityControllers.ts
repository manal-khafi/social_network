import { Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();


const createCommunity = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name, description, banner_url, is_private, created_by } = req.body;
        await prisma.community.create({
            data: {
                name,
                description,
                banner_url,
                is_private: Boolean(is_private),
                created_by,
            },
        });

        res.status(201).json({
            status: "success",
            message: "Communauté créée avec succès",
        });
    } catch (error) {
        res.status(500).json({
            status: "error",
            message: "Erreur lors de la création de la communauté",
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
        const { name, description, banner_url, is_private } = req.body;
        const updatedCommunity = await prisma.community.update({
            where: { id: id },
            data: {
                name,
                description,
                banner_url,
                is_private: Boolean(is_private),
            },
        });

        res.status(200).json({
            status: "success",
            data: updatedCommunity,
        });
    } catch (error) {
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