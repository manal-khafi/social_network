"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const profileController_1 = require("../Controllers/user/profileController");
const authMiddlware_1 = require("../Middleware/authMiddlware");
const ProfileRouter = (0, express_1.Router)();
// Current user profile
ProfileRouter.get("/me", authMiddlware_1.authMiddleware, profileController_1.getCurrentUserProfile);
ProfileRouter.put("/me", authMiddlware_1.authMiddleware, profileController_1.updateCurrentUserProfile);
ProfileRouter.put("/me/avatar", authMiddlware_1.authMiddleware, profileController_1.updateMyAvatar);
ProfileRouter.put("/me/cover", authMiddlware_1.authMiddleware, profileController_1.updateCoverImage);
// Public profile (by username)
ProfileRouter.get("/:username", authMiddlware_1.authMiddleware, profileController_1.getUserProfile);
exports.default = ProfileRouter;
