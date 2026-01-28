import { Router } from "express";
import { getMyLikedPosts } from "../Controllers/Settings/likedpostController";
import { authMiddleware } from "../Middleware/authMiddlware";

import { blockGuard } from "../Middleware/Block/blockGuardMiddleware";

const MyLikedPosts = Router();

// On applique le middleware ici avant le controller
MyLikedPosts.get("/mylikes", authMiddleware, blockGuard(), getMyLikedPosts);

export default MyLikedPosts;