"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const likedpostController_1 = require("../Controllers/Settings/likedpostController");
const authMiddlware_1 = require("../Middleware/authMiddlware");
const blockGuardMiddleware_1 = require("../Middleware/Block/blockGuardMiddleware");
const MyLikedPosts = (0, express_1.Router)();
// On applique le middleware ici avant le controller
MyLikedPosts.get("/mylikes", authMiddlware_1.authMiddleware, (0, blockGuardMiddleware_1.blockGuard)(), likedpostController_1.getMyLikedPosts);
exports.default = MyLikedPosts;
