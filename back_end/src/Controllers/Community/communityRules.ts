import { Request, Response, NextFunction } from "express";
import prisma from "../../config/prismaClient";
import { requireCommunityAdmin } from "./communityAccess";

// Get all rules for a community
const getCommunityRules = async (req: Request, res: Response, next: NextFunction) => {
  const { communityId } = req.params as { [key: string]: string };

  try {
    const rules = await prisma.communityRule.findMany({
      where: { community_id: communityId },
      orderBy: { order: 'asc' },
    });

    res.status(200).json({
      status: "success",
      data: rules,
    });
  } catch (error) {
    console.error("Error fetching community rules:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to load rules",
    });
  }
};

// Create a new rule
const createCommunityRule = async (req: Request, res: Response, next: NextFunction) => {
  const { communityId } = req.params as { [key: string]: string };
  const { title, description, order } = req.body;

  try {
    const access = await requireCommunityAdmin(req, res, communityId);
    if (!access) return;

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
  } catch (error) {
    console.error("Error creating community rule:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to create the rule",
    });
  }
};

// Update a rule
const updateCommunityRule = async (req: Request, res: Response, next: NextFunction) => {
  const { communityId, ruleId } = req.params as { [key: string]: string };
  const { title, description, order } = req.body;

  try {
    const access = await requireCommunityAdmin(req, res, communityId);
    if (!access) return;

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (order !== undefined) updateData.order = order;

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
        message: "Rule not found",
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
  } catch (error) {
    console.error("Error updating community rule:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to update the rule",
    });
  }
};

// Delete a rule
const deleteCommunityRule = async (req: Request, res: Response, next: NextFunction) => {
  const { communityId, ruleId } = req.params as { [key: string]: string };

  try {
    const access = await requireCommunityAdmin(req, res, communityId);
    if (!access) return;

    const deletedRule = await prisma.communityRule.deleteMany({
      where: {
        id: ruleId,
        community_id: communityId,
      },
    });

    if (deletedRule.count === 0) {
      return res.status(404).json({
        status: "error",
        message: "Rule not found",
      });
    }

    res.status(200).json({
      status: "success",
      message: "Rule deleted",
    });
  } catch (error) {
    console.error("Error deleting community rule:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to delete the rule",
    });
  }
};

export default {
  getCommunityRules,
  createCommunityRule,
  updateCommunityRule,
  deleteCommunityRule,
};
