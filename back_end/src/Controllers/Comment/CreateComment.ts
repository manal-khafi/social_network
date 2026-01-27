import { Request, Response } from 'express';
import prisma from "../../config/prismaClient";


const Comment = async (req: Request, res: Response) => {
      try{
        const { content, parent_comment_id } = req.body;
        const postId = req.params.postId ?? req.body.postId;
        const userId = req.user?.id ?? req.params.userId;

        if (!postId) {
            return res.status(400).json({message: 'Post ID is required'});
        }
        if (!userId) {
            return res.status(401).json({message: 'Unauthorized'});
        }

        const findpost = await prisma.post.findUnique({
            where: {id: postId}
        });

        if(!findpost){
            return res.status(404).json({message: 'Post not found'});
        }

        const finduser = await prisma.user.findUnique({
            where:{id: userId},
            select: { id: true, username: true, display_name: true, avatar_url: true }
        });
        if(!finduser){
            return res.status(404).json({message: 'User not found'});
        }
        const newComment = await prisma.comment.create({
            data:{
                content: content,
                post_id: postId,
                user_id: userId,
                parent_comment_id: parent_comment_id || null,
            }
        });
        return res.status(201).json({
          message: 'Comment created successfully',
          comment: {
            id: newComment.id,
            postId: newComment.post_id,
            userId: newComment.user_id,
            username: finduser.username || finduser.display_name || "Unknown User",
            avatar: finduser.avatar_url ?? null,
            content: newComment.content,
            likes: 0,
            isLiked: false,
            timestamp: newComment.created_at.toISOString(),
            replies: [],
            parent_comment_id: newComment.parent_comment_id ?? null,
          }
        });


      }catch (error) {
        res.status(500).json({ message: 'Internal server error' });
      }
};

export default Comment;
