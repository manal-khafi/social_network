import { Request, Response } from 'express';
import prisma from '../config/prismaClient';

export const toggleLike = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        const { postId, commentId } = req.params;
        const targetPostId = postId ?? null;
        const targetCommentId = commentId ?? null;

        if (!targetPostId && !targetCommentId) {
            return res.status(400).json({ message: "postId or commentId is required" });
        }
        const existingLike = await prisma.like.findFirst({
            where: {
                user_id: userId!,
                post_id: targetPostId,
                comment_id: targetCommentId,
            },
        });
        //unlike 
        if (existingLike) {
            await prisma.like.delete({
                where: { id: existingLike.id },
            });
            
            // Get updated counts
            const post = targetPostId ? await prisma.post.findUnique({
                where: { id: targetPostId },
                include: { _count: { select: { likes: true } } }
            }) : null;
            
            return res.json({
                liked: false,
                message: 'Post unliked',
                likes: post?._count.likes ?? 0
            });
        }

        //like
        await prisma.like.create({
            data: {
                user_id: userId!,
                post_id: targetPostId,
                comment_id: targetCommentId,
            },
        });
        
        // Get updated counts
        const post = targetPostId ? await prisma.post.findUnique({
            where: { id: targetPostId },
            include: { _count: { select: { likes: true } } }
        }) : null;
        
        return res.json({ 
            liked: true,
            message: 'Post liked',
            likes: post?._count.likes ?? 0
        });
    } catch (error) {
        res.status(500).json({ message: "something went wrong" });
        
    }
};
