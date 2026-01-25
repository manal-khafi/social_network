import { Request, Response } from 'express';
import prisma from '../config/prismaClient';

export const toggleLike = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        const { postId } = req.params;
        const existingLike = await prisma.like.findFirst({
            where: {
                user_id: userId!,
                post_id: postId,
                comment_id: null, // Explicitly look for a like on a post, not a comment
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
                user_id: userId!,
                post_id: postId,
            },
        });
        return res.json({ liked: true,
            message: 'Post liked'
        });
    } catch (error) {
        res.status(500).json({ message: "something went wrong" });
        
    }
};
