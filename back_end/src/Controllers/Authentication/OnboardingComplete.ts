import { Request, Response } from "express";
import prisma from "../../config/prismaClient";

export const OnboardingComplete = async (req: Request, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Not authenticated",
            });
        }

        const updatedUser = await prisma.user.update({
            where: { id: req.user.id },
            data: { onboarding_done: true },
        });

        return res.status(200).json({
            success: true,
            user: updatedUser,
        });
    } catch (error) {
        console.error("Onboarding complete error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};
