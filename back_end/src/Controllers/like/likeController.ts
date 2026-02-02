import { Request, Response } from 'express';
import prisma from '../../config/prismaClient';
import { isBlockedEitherWay } from '../../Service/BlockService';
import { createNotification } from '../../Service/notificationService';
import { emitNotificationNew } from '../../Service/notificationRealtime';

export const toggleLike = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        const { postId, commentId } = req.params;
        const targetPostId = postId ?? null;
        const targetCommentId = commentId ?? null;

        if (!targetPostId && !targetCommentId) {
            return res.status(400).json({ message: "postId or commentId is required" });
        }
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        let targetOwnerId: string | null = null;
        if (targetPostId) {
            const post = await prisma.post.findUnique({
                where: { id: targetPostId },
                select: { user_id: true }
            });
            if (!post) {
                return res.status(404).json({ message: "Post not found" });
            }
            targetOwnerId = post.user_id;
        } else if (targetCommentId) {
            const comment = await prisma.comment.findUnique({
                where: { id: targetCommentId },
                select: { user_id: true }
            });
            if (!comment) {
                return res.status(404).json({ message: "Comment not found" });
            }
            targetOwnerId = comment.user_id;
        }

        if (targetOwnerId && await isBlockedEitherWay(userId, targetOwnerId)) {
            return res.status(403).json({ message: "Forbidden" });
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
        const createdLike = await prisma.like.create({
            data: {
                user_id: userId!,
                post_id: targetPostId,
                comment_id: targetCommentId,
            },
        });

        // Realtime notification (posts only)
        if (targetPostId && targetOwnerId && targetOwnerId !== userId) {
            const notif = await createNotification({
                userId: targetOwnerId,
                code: 'POST_LIKED',
                title: 'Post liked',
                message: 'liked your post',
                senderId: userId,
                sourceId: targetPostId,
                sourceType: 'post',
                metadata: { postId: targetPostId, likeId: createdLike.id },
            });
            await emitNotificationNew({
                receiverId: targetOwnerId,
                kind: 'like',
                notification: notif,
                extra: { postId: targetPostId },
            });
        }
        
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
