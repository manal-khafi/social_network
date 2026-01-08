import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const buildCommentTree = (comments: any[], parentId: string | null = null): any[] => {
  return comments
    .filter(comment => comment.parent_comment_id === parentId)
    .map(comment => ({
      ...comment,
      replies: buildCommentTree(comments, comment.id)
    }));
};

export const getComment = async (req: Request, res: Response) => {
  const postId = req.params.postId;
  try {
    const comments = await prisma.comment.findMany({
      where: {
        post_id: postId,
        is_deleted: false
      },
      orderBy: { created_at: "asc" }
    });
    const commentsTree = buildCommentTree(comments, null);

    res.status(200).json(commentsTree);

  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};


export default getComment;
