"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const likeController_1 = require("../Controllers/like/likeController");
const authMiddlware_1 = require("../Middleware/authMiddlware");
const blockGuardMiddleware_1 = require("../Middleware/Block/blockGuardMiddleware");
const router = (0, express_1.Router)();
router.post('/posts/:postId/like', authMiddlware_1.authMiddleware, (0, blockGuardMiddleware_1.blockGuard)(), likeController_1.toggleLike);
exports.default = router;
