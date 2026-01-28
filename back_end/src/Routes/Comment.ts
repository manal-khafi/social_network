import  Comment  from "../Controllers/Comment/CreateComment";
import { deleteComment } from "../Controllers/Comment/deleteComment";
import modifierComment from "../Controllers/Comment/modifierComment";
import getComment from "../Controllers/Comment/getComment";
import { authMiddleware } from "../Middleware/authMiddlware";
import { Router } from "express";
import { toggleLike } from "../Controllers/like/likeController";

import { blockGuard } from "../Middleware/Block/blockGuardMiddleware";



const commentRouter= Router();



commentRouter.post("/create-comment",authMiddleware, blockGuard(), Comment);

commentRouter.post("/like/:commentId", authMiddleware, blockGuard(), toggleLike);

commentRouter.delete("/delete-comment/:commentId",authMiddleware, blockGuard(), deleteComment);

commentRouter.put("/modify-comment/:commentId",authMiddleware, blockGuard(), modifierComment);

commentRouter.get("/get-comments/:postId",authMiddleware, blockGuard(), getComment);


export default commentRouter;
