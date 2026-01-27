import  Comment  from "../Controllers/Comment/CreateComment";
import { deleteComment } from "../Controllers/Comment/deleteComment";
import modifierComment from "../Controllers/Comment/ModifierComment";
import getCommet from "../Controllers/Comment/getComment";
import { authMiddleware } from "../Middleware/authMiddlware";
import { Router } from "express";
import { toggleLike } from "../Controllers/like/likeController";

const commentRouter= Router();



commentRouter.post("/create-comment/:userId",authMiddleware, Comment);
commentRouter.post("/:postId", authMiddleware, Comment);
commentRouter.post("/like/:commentId", authMiddleware, toggleLike);
commentRouter.delete("/delete-comment/:commentId",authMiddleware, deleteComment);
commentRouter.put("/modify-comment/:commentId",authMiddleware, modifierComment);
commentRouter.get("/get-comments/:postId",authMiddleware, getCommet);
commentRouter.get("/:postId", authMiddleware, getCommet);

export default commentRouter;
