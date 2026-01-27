import { Router } from "express";
import {
  getUserProfile,
  getCurrentUserProfile,
  updateCurrentUserProfile,
  updateMyAvatar,
} from "../Controllers/user/profileController";
import { authMiddleware } from "../Middleware/authMiddlware";

const ProfileRouter = Router();

// Current user profile
ProfileRouter.get("/me", authMiddleware, getCurrentUserProfile);
ProfileRouter.put("/me", authMiddleware, updateCurrentUserProfile);
ProfileRouter.put("/me/avatar", authMiddleware, updateMyAvatar);

// Public profile (by username)
ProfileRouter.get("/:username", authMiddleware, getUserProfile);

export default ProfileRouter;
