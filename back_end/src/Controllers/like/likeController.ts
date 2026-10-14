import { Request, Response } from 'express';
import prisma from '../../config/prismaClient';
import { isBlockedEitherWay } from '../../services/BlockService';
import { canViewPost } from '../../services/postVisibility';
import { NotificationService } from '../../services/notificationService';

export const toggleLike = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        const { postId, commentId } = req.params as { [key: string]: string } as { postId?: string; commentId?: string };
        const targetPostId = postId || null;
        const targetCommentId = commentId || null;

        if (!targetPostId && !targetCommentId) {
            return res.status(400).json({ message: "postId or commentId is required" });
        }
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        let targetOwnerId: string | null = null;
        let commentPostId: string | null = null;
        if (targetPostId) {
            const post = await prisma.post.findUnique({
                where: { id: targetPostId },
                select: { user_id: true }
            });
            if (!post || !(await canViewPost(userId, targetPostId))) {
                return res.status(404).json({ message: "Post not found" });
            }
            targetOwnerId = post.user_id;
        } else if (targetCommentId) {
            const comment = await prisma.comment.findUnique({
                where: { id: targetCommentId },
                select: { user_id: true, post_id: true }
            });
            // A comment is only reachable through a post the viewer can see.
            if (!comment || !(await canViewPost(userId, comment.post_id))) {
                return res.status(404).json({ message: "Comment not found" });
            }
            targetOwnerId = comment.user_id;
            commentPostId = comment.post_id;
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

            // Withdraw the "liked your post/comment" notification.
            NotificationService.removeNotification('like', userId!, (targetPostId ?? targetCommentId)!);
            
            // Get updated counts
            const post = targetPostId ? await prisma.post.findUnique({
                where: { id: targetPostId },
                include: { _count: { select: { likes: true } } }
            }) : null as any;
            
            return res.json({
                liked: false,
                message: 'Post unliked',
                likes: post?._count?.likes ?? 0
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
        
        if (targetOwnerId) {
            NotificationService.notify('like', {
                recipientId: targetOwnerId,
                actorId: userId!,
                sourceId: (targetPostId ?? targetCommentId)!,
                sourceType: targetPostId ? 'post' : 'comment',
                metadata: targetPostId
                    ? { post_id: targetPostId }
                    : { post_id: commentPostId, comment_id: targetCommentId },
            });
        }

        // Get updated counts
        const post = targetPostId ? await prisma.post.findUnique({
            where: { id: targetPostId },
            include: { _count: { select: { likes: true } } }
        }) : null as any;
        
        return res.json({ 
            liked: true,
            message: 'Post liked',
            likes: post?._count?.likes ?? 0
        });
    } catch (error) {
        res.status(500).json({ message: "something went wrong" });
        
    }
};
