import { Router } from "express";
import { authMiddleware } from "../Middleware/authMiddlware";
import { createPost } from "../Controllers/Posts/CreatePost";
import { getPosts } from "../Controllers/Posts/GetPosts";
import { getMyPosts } from "../Controllers/Posts/GetMyPosts";
import { toggleLike } from "../Controllers/like/likeController";
import { toggleSave } from "../Controllers/Posts/ToggleSave";
import { toggleRepost } from "../Controllers/Posts/ToggleRepost";
import { updatePost } from "../Controllers/Posts/UpdatePost";
import { deletePost } from "../Controllers/Posts/DeletePost";

const postsRouter = Router();

postsRouter.get("/", getPosts);
postsRouter.get("/me", authMiddleware, getMyPosts);
postsRouter.post("/", authMiddleware, createPost);
postsRouter.put("/:postId", authMiddleware, updatePost);
postsRouter.delete("/:postId", authMiddleware, deletePost);
postsRouter.post("/:postId/like", authMiddleware, toggleLike);
postsRouter.post("/:postId/save", authMiddleware, toggleSave);
postsRouter.post("/:postId/repost", authMiddleware, toggleRepost);

export default postsRouter;
