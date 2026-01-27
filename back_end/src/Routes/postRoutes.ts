import { Router } from "express";
import { getMyLikedPosts } from "../Controllers/Settings/postController";
import { authMiddleware } from "../Middleware/authMiddlware";

const MyLikedPosts = Router();

// On applique le middleware ici avant le controller
MyLikedPosts.get("/mylikes", authMiddleware, getMyLikedPosts);

export default MyLikedPosts;