"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const saveController_1 = require("../Controllers/Archive/saveController");
const authMiddlware_1 = require("../Middleware/authMiddlware");
const blockGuardMiddleware_1 = require("../Middleware/Block/blockGuardMiddleware");
const router = (0, express_1.Router)();
// Route protégée par le middleware d'authentification
router.get("/archived", authMiddlware_1.authMiddleware, (0, blockGuardMiddleware_1.blockGuard)(), saveController_1.getArchivedPosts);
exports.default = router;
