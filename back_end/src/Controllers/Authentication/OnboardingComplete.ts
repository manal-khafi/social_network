import { Request, Response } from "express";
import prisma from "../../config/prismaClient";
import { generateAccessToken } from "../../util/jwt";

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

        const tokenPayload = {
            id: updatedUser.id,
            email: updatedUser.email,
            username: updatedUser.username ?? "",
            avatar_url: updatedUser.avatar_url ?? null,
            role: req.user.role,
            permissions: req.user.permissions ?? [],
            onboarding_done: true,
        };

        const newAccessToken = generateAccessToken(tokenPayload);
        res.setHeader("x-access-token", newAccessToken);

        return res.status(200).json({
            success: true,
            user: updatedUser,
            token: newAccessToken,
        });
    } catch (error) {
        console.error("Onboarding complete error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};
