import { Request, Response } from "express";
import prisma from "../../config/prismaClient";
import { Prisma } from "@prisma/client";

async function collectDescendants(
  tx: Prisma.TransactionClient,
  parentIds: string[],
  collected: Set<string>
): Promise<void> {
  if (parentIds.length === 0) return;

  const children = await tx.comment.findMany({
    where: { parent_comment_id: { in: parentIds } },
    select: { id: true },
  });

  const childIds: string[] = [];
  for (const c of children) {
    if (!collected.has(c.id)) {
      collected.add(c.id);
      childIds.push(c.id);
    }
  }

  await collectDescendants(tx, childIds, collected);
}

export const deleteComment = async (req: Request, res: Response) => {
  const commentId = (req.params.commentId as string) as string;
  const userId = req.user?.id;

  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  try {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: {
        id: true,
        user_id: true,
        post_id: true,
        post: { select: { user_id: true } },
      },
    }) as any;

    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    const isCommentOwner = comment.user_id === userId;
    const isPostOwner = comment.post?.user_id === userId;

    if (!isCommentOwner && !isPostOwner) {
      return res
        .status(403)
        .json({ message: "You are not allowed to delete this comment" });
    }

    const deletedCount = await prisma.$transaction(async (tx) => {
      const ids = new Set<string>([commentId]);

      await collectDescendants(tx, [commentId], ids);

      const idsToDelete = Array.from(ids);

      const del = await tx.comment.deleteMany({
        where: { id: { in: idsToDelete } },
      });

      return del.count;
    });

    return res.status(200).json({ success: true, deletedCount });
  } catch (error) {
    console.error("Error deleting comment:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
