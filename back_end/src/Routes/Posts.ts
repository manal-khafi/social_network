import { Router } from "express";
import { authMiddleware } from "../Middleware/authMiddlware";
import { createPost } from "../Controllers/Posts/CreatePost";
import { getPosts } from "../Controllers/Posts/GetPosts";
import { getMyPosts, getMyReposts} from "../Controllers/Posts/GetMyPosts";
import { getUserPosts, getUserReposts } from "../Controllers/Posts/GetUserPosts";
import { getMySavedPosts } from "../Controllers/Posts/GetMySavedPosts";
import { getMyArchivedPosts } from "../Controllers/Posts/GetMyArchivedPosts";
import { toggleLike } from "../Controllers/like/likeController";
import { toggleSave } from "../Controllers/Posts/ToggleSave";
import { toggleRepost } from "../Controllers/Posts/ToggleRepost";
import { updatePost } from "../Controllers/Posts/UpdatePost";
import { deletePost } from "../Controllers/Posts/DeletePost";
import { archivePost, unarchivePost } from "../Controllers/Posts/ArchiveController";

import { blockGuard } from "../Middleware/Block/blockGuardMiddleware";
import { getPost } from "../Controllers/Posts/GetPost";

const postsRouter = Router();

postsRouter.get("/", getPosts);
postsRouter.get("/me", authMiddleware, getMyPosts); // Blocking not applicable to own posts
postsRouter.get("/me/reposts", authMiddleware, getMyReposts); // Blocking not applicable to own reposts
postsRouter.get("/me/saved", authMiddleware, getMySavedPosts); // Blocking not applicable to own saved posts
postsRouter.get("/me/archived", authMiddleware, getMyArchivedPosts); // Blocking not applicable to own archived posts
postsRouter.get("/user/:userId", authMiddleware, blockGuard(), getUserPosts);
postsRouter.get("/user/:userId/reposts", authMiddleware, blockGuard(), getUserReposts);
// Only matches a post id (UUID), so GET /api/posts/mylikes etc. on the other
// routers mounted at /api/posts still reach them.
postsRouter.get("/:postId([0-9a-fA-F-]{36})", getPost);
postsRouter.post("/", authMiddleware, createPost);
postsRouter.put("/:postId", authMiddleware, updatePost);
postsRouter.delete("/:postId", authMiddleware, blockGuard(), deletePost);
postsRouter.post("/:postId/like", authMiddleware, blockGuard(), toggleLike);
postsRouter.post("/:postId/save", authMiddleware, blockGuard(), toggleSave);
postsRouter.post("/:postId/repost", authMiddleware, blockGuard(), toggleRepost);
postsRouter.patch("/:postId/archive", authMiddleware, blockGuard(), archivePost);
postsRouter.patch("/:postId/unarchive", authMiddleware, blockGuard(), unarchivePost);

export default postsRouter;
