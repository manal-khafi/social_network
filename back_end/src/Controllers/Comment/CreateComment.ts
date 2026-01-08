import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();


const Comment= async(req: Request, res: Response) => {
      try{
        const {postId, content, parent_comment}= req.body;
        const CreaterComment= req.params;

        const findpost= await prisma.post.findUnique({
            where: {id:postId}
        });

        if(!findpost){
            return res.status(404).json({message: 'Post not found'});
        }

        const finduser= await prisma.user.findUnique({
            where:{id: CreaterComment.userId}
        });
        if(!finduser){
            return res.status(404).json({message: 'User not found'});
        }
        const newComment= await prisma.comment.create({
            data:{
                content: content,
                post_id: postId,
                user_id: CreaterComment.userId,
                parent_comment_id: parent_comment || null,
            }
        });
        return res.status(201).json({message: 'Comment created successfully', comment: newComment});


      }catch (error) {
        res.status(500).json({ message: 'Internal server error' });
      }
};

export default Comment;