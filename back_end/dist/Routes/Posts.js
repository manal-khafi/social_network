"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddlware_1 = require("../Middleware/authMiddlware");
const CreatePost_1 = require("../Controllers/Posts/CreatePost");
const GetPosts_1 = require("../Controllers/Posts/GetPosts");
const GetMyPosts_1 = require("../Controllers/Posts/GetMyPosts");
const GetUserPosts_1 = require("../Controllers/Posts/GetUserPosts");
const GetMySavedPosts_1 = require("../Controllers/Posts/GetMySavedPosts");
const GetMyArchivedPosts_1 = require("../Controllers/Posts/GetMyArchivedPosts");
const likeController_1 = require("../Controllers/like/likeController");
const ToggleSave_1 = require("../Controllers/Posts/ToggleSave");
const ToggleRepost_1 = require("../Controllers/Posts/ToggleRepost");
const UpdatePost_1 = require("../Controllers/Posts/UpdatePost");
const DeletePost_1 = require("../Controllers/Posts/DeletePost");
const ArchiveController_1 = require("../Controllers/Posts/ArchiveController");
const blockGuardMiddleware_1 = require("../Middleware/Block/blockGuardMiddleware");
const postsRouter = (0, express_1.Router)();
postsRouter.get("/", GetPosts_1.getPosts);
postsRouter.get("/me", authMiddlware_1.authMiddleware, GetMyPosts_1.getMyPosts); // Blocking not applicable to own posts
postsRouter.get("/me/reposts", authMiddlware_1.authMiddleware, GetMyPosts_1.getMyReposts); // Blocking not applicable to own reposts
postsRouter.get("/me/saved", authMiddlware_1.authMiddleware, GetMySavedPosts_1.getMySavedPosts); // Blocking not applicable to own saved posts
postsRouter.get("/me/archived", authMiddlware_1.authMiddleware, GetMyArchivedPosts_1.getMyArchivedPosts); // Blocking not applicable to own archived posts
postsRouter.get("/user/:userId", authMiddlware_1.authMiddleware, (0, blockGuardMiddleware_1.blockGuard)(), GetUserPosts_1.getUserPosts);
postsRouter.get("/user/:userId/reposts", authMiddlware_1.authMiddleware, (0, blockGuardMiddleware_1.blockGuard)(), GetUserPosts_1.getUserReposts);
postsRouter.post("/", authMiddlware_1.authMiddleware, CreatePost_1.createPost);
postsRouter.put("/:postId", authMiddlware_1.authMiddleware, UpdatePost_1.updatePost);
postsRouter.delete("/:postId", authMiddlware_1.authMiddleware, (0, blockGuardMiddleware_1.blockGuard)(), DeletePost_1.deletePost);
postsRouter.post("/:postId/like", authMiddlware_1.authMiddleware, (0, blockGuardMiddleware_1.blockGuard)(), likeController_1.toggleLike);
postsRouter.post("/:postId/save", authMiddlware_1.authMiddleware, (0, blockGuardMiddleware_1.blockGuard)(), ToggleSave_1.toggleSave);
postsRouter.post("/:postId/repost", authMiddlware_1.authMiddleware, (0, blockGuardMiddleware_1.blockGuard)(), ToggleRepost_1.toggleRepost);
postsRouter.patch("/:postId/archive", authMiddlware_1.authMiddleware, (0, blockGuardMiddleware_1.blockGuard)(), ArchiveController_1.archivePost);
postsRouter.patch("/:postId/unarchive", authMiddlware_1.authMiddleware, (0, blockGuardMiddleware_1.blockGuard)(), ArchiveController_1.unarchivePost);
exports.default = postsRouter;
