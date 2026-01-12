import { Request, Response } from 'express';
import { prisma } from '../config/prismaClient';

export const toggleLike = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        const { postId } = req.params;
        const existingLike = await prisma.like.findUnique({
            where: {
                userId_postId: {
                    userId: userId!,
                    postId: postId,
                },
            },
        });
        //unlike 
        if (existingLike) {
            await prisma.like.delete({
                where: { id: existingLike.id },
            });
            return res.json({
                liked: false,
                message: 'Post unliked'
            });
        }

        //like
        await prisma.like.create({
            data: {
                userId: userId!,
                postId: postId,
            },
        });
        return res.json({ liked: true,
            message: 'Post liked'
        });
    } catch (error) {
        res.status(500).json({ message: "something went wrong" });
        
    }
};