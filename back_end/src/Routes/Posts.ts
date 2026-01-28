import { Router } from "express";
import { authMiddleware } from "../Middleware/authMiddlware";
import { createPost } from "../Controllers/Posts/CreatePost";
import { getPosts } from "../Controllers/Posts/GetPosts";
import { getMyPosts, getMyReposts } from "../Controllers/Posts/GetMyPosts";
import { getMySavedPosts } from "../Controllers/Posts/GetMySavedPosts";
import { getMyArchivedPosts } from "../Controllers/Posts/GetMyArchivedPosts";
import { toggleLike } from "../Controllers/like/likeController";
import { toggleSave } from "../Controllers/Posts/ToggleSave";
import { toggleRepost } from "../Controllers/Posts/ToggleRepost";
import { updatePost } from "../Controllers/Posts/UpdatePost";
import { deletePost } from "../Controllers/Posts/DeletePost";
import { archivePost, unarchivePost } from "../Controllers/Posts/ArchiveController";

const postsRouter = Router();

postsRouter.get("/", getPosts);
postsRouter.get("/me", authMiddleware, getMyPosts);
postsRouter.get("/me/reposts", authMiddleware, getMyReposts);
postsRouter.get("/me/saved", authMiddleware, getMySavedPosts);
postsRouter.get("/me/archived", authMiddleware, getMyArchivedPosts);
postsRouter.post("/", authMiddleware, createPost);
postsRouter.put("/:postId", authMiddleware, updatePost);
postsRouter.delete("/:postId", authMiddleware, deletePost);
postsRouter.post("/:postId/like", authMiddleware, toggleLike);
postsRouter.post("/:postId/save", authMiddleware, toggleSave);
postsRouter.post("/:postId/repost", authMiddleware, toggleRepost);
postsRouter.patch("/:postId/archive", authMiddleware, archivePost);
postsRouter.patch("/:postId/unarchive", authMiddleware, unarchivePost);

export default postsRouter;
