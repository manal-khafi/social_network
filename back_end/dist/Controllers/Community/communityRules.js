"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// Get all rules for a community
const getCommunityRules = async (req, res, next) => {
    const { communityId } = req.params;
    try {
        const rules = await prisma.communityRule.findMany({
            where: { community_id: communityId },
            orderBy: { order: 'asc' },
        });
        res.status(200).json({
            status: "success",
            data: rules,
        });
    }
    catch (error) {
        console.error("Error fetching community rules:", error);
        res.status(500).json({
            status: "error",
            message: "Erreur lors de la récupération des règles",
        });
    }
};
// Create a new rule
const createCommunityRule = async (req, res, next) => {
    const { communityId } = req.params;
    const { title, description, order } = req.body;
    try {
        if (!title || !description) {
            return res.status(400).json({
                status: "error",
                message: "Le titre et la description sont requis",
            });
        }
        const newRule = await prisma.communityRule.create({
            data: {
                community_id: communityId,
                title,
                description,
                order: order || 0,
            },
        });
        res.status(201).json({
            status: "success",
            data: newRule,
        });
    }
    catch (error) {
        console.error("Error creating community rule:", error);
        res.status(500).json({
            status: "error",
            message: "Erreur lors de la création de la règle",
        });
    }
};
// Update a rule
const updateCommunityRule = async (req, res, next) => {
    const { communityId, ruleId } = req.params;
    const { title, description, order } = req.body;
    try {
        const updateData = {};
        if (title !== undefined)
            updateData.title = title;
        if (description !== undefined)
            updateData.description = description;
        if (order !== undefined)
            updateData.order = order;
        const updatedRule = await prisma.communityRule.updateMany({
            where: {
                id: ruleId,
                community_id: communityId,
            },
            data: updateData,
        });
        if (updatedRule.count === 0) {
            return res.status(404).json({
                status: "error",
                message: "Règle non trouvée",
            });
        }
        // Fetch the updated rule to return it
        const rule = await prisma.communityRule.findUnique({
            where: { id: ruleId },
        });
        res.status(200).json({
            status: "success",
            data: rule,
        });
    }
    catch (error) {
        console.error("Error updating community rule:", error);
        res.status(500).json({
            status: "error",
            message: "Erreur lors de la mise à jour de la règle",
        });
    }
};
// Delete a rule
const deleteCommunityRule = async (req, res, next) => {
    const { communityId, ruleId } = req.params;
    try {
        const deletedRule = await prisma.communityRule.deleteMany({
            where: {
                id: ruleId,
                community_id: communityId,
            },
        });
        if (deletedRule.count === 0) {
            return res.status(404).json({
                status: "error",
                message: "Règle non trouvée",
            });
        }
        res.status(200).json({
            status: "success",
            message: "Règle supprimée avec succès",
        });
    }
    catch (error) {
        console.error("Error deleting community rule:", error);
        res.status(500).json({
            status: "error",
            message: "Erreur lors de la suppression de la règle",
        });
    }
};
exports.default = {
    getCommunityRules,
    createCommunityRule,
    updateCommunityRule,
    deleteCommunityRule,
};
