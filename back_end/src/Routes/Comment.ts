import  Comment  from "../Controllers/Comment/CreateComment";
import { deleteComment } from "../Controllers/Comment/deleteComment";
import modifierComment from "../Controllers/Comment/ModifierComment";
import getCommet from "../Controllers/Comment/getComment";
import { authMiddleware } from "../Middleware/authMiddlware";
import { Router } from "express";
import { toggleLike } from "../Controllers/like/likeController";

import { blockGuard } from "../Middleware/Block/blockGuardMiddleware";



const commentRouter= Router();



commentRouter.post("/create-comment/:userId",authMiddleware, blockGuard(), Comment);

commentRouter.post("/:postId", authMiddleware, blockGuard(), Comment);

commentRouter.post("/like/:commentId", authMiddleware, blockGuard(), toggleLike);

commentRouter.delete("/delete-comment/:commentId",authMiddleware, blockGuard(), deleteComment);

commentRouter.put("/modify-comment/:commentId",authMiddleware, blockGuard(), modifierComment);

commentRouter.get("/get-comments/:postId",authMiddleware, blockGuard(), getCommet);

commentRouter.get("/:postId", authMiddleware, blockGuard(), getCommet);

export default commentRouter;
