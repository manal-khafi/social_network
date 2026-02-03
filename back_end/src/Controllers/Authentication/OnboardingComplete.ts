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
            include: {
                role: {
                    include: {
                        rolePermissions: {
                            include: { permission: true },
                        },
                    },
                },
            },
        });

        const permissions =
            updatedUser.role?.rolePermissions.map((rp: any) => rp.permission.code) || [];

        const tokenPayload = {
            id: updatedUser.id,
            email: updatedUser.email,
            username: updatedUser.username,
            avatar_url: updatedUser.avatar_url ?? null,
            role: updatedUser.role?.name,
            permissions,
            onboarding_done: true,
        };

        const token = generateAccessToken(tokenPayload);

        return res.status(200).json({
            success: true,
            user: {
                id: updatedUser.id,
                email: updatedUser.email,
                username: updatedUser.username,
                role: updatedUser.role?.name,
                permissions,
                onboarding_done: true,
            },
            token,
        });
    } catch (error) {
        console.error("Onboarding complete error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};
