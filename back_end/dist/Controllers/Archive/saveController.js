"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getArchivedPosts = void 0;
const prismaClient_1 = __importDefault(require("../../config/prismaClient"));
/**
 * Récupérer les posts sauvegardés (Archives)
 */
const getArchivedPosts = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Non authentifié"
            });
        }
        // On récupère les entrées du modèle 'Save' pour cet utilisateur
        const archivedSaves = await prismaClient_1.default.save.findMany({
            where: {
                user_id: userId,
            },
            include: {
                post: {
                    include: {
                        user: {
                            select: {
                                username: true,
                                display_name: true,
                                avatar_url: true,
                            },
                        },
                        _count: {
                            select: {
                                likes: true,
                                comments: true,
                                saves: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                saved_at: "desc",
            },
        });
        // Transformation pour renvoyer une liste propre de posts
        const posts = archivedSaves.map((save) => ({
            ...save.post,
            saved_at: save.saved_at,
            isSaved: true,
        }));
        return res.status(200).json({
            success: true,
            data: posts
        });
    }
    catch (error) {
        console.error("Erreur Archived Posts:", error);
        return res.status(500).json({
            success: false,
            message: "Erreur serveur lors de la récupération des archives"
        });
    }
};
exports.getArchivedPosts = getArchivedPosts;
