import { Router } from "express";
import { getUserProfile, getCurrentUserProfile } from "../Controllers/user/profileController";
import { authMiddleware } from "../Middleware/authMiddlware";

const ProfileRouter = Router();

// Route to get the current logged-in user's profile
ProfileRouter.get("/me", authMiddleware, getCurrentUserProfile);

// Route to get a user's profile. Auth is required to check for private profiles.
ProfileRouter.get("/:username", authMiddleware, getUserProfile);

export default ProfileRouter;
