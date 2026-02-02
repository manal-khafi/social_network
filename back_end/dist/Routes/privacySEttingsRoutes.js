"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const privacySettings_1 = require("../Controllers/Settings/privacySettings");
const authMiddlware_1 = require("../Middleware/authMiddlware");
const router = (0, express_1.Router)();
router.get("/me/privacy", authMiddlware_1.authMiddleware, privacySettings_1.getPrivacySettings);
router.patch("/me/privacy", authMiddlware_1.authMiddleware, privacySettings_1.updatePrivacySettings);
exports.default = router;
