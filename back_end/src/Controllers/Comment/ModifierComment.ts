import prisma from "../../config/prismaClient";
import { Request, Response } from "express";

const modifierComment = async (req: Request, res: Response)=>{
    try{
        const {commentId} = req.params;
        const {content}= req.body;
        const userId = req.user?.id;
        const comment= await prisma.comment.findUnique({
            where:{id: commentId}
        });
        const create_comment = await prisma.user.findUnique({
            where:{id: userId}
        });

        if(!comment || comment.is_deleted){
            return res.status(404).json({message:'Comment not found or already deleted'});
        }
        if(comment.user_id !== userId){
            return res.status(403).json({message:'You are not allowed to modify this comment'});
        }
        const updateComent = await prisma.comment.update({
            where: {id: commentId},
            data: {content: content}
        });
        return res.status(200).json(updateComent);
    }catch(error){
        return res.status(500).json({message:'Internal Server Error'});
    }
}

export default modifierComment;
