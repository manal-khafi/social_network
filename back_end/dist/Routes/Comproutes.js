"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Create_1 = __importDefault(require("../Controllers/Account/Create"));
const multer_1 = __importDefault(require("multer"));
const authMiddlware_1 = require("../Middleware/authMiddlware");
const ComptRouter = (0, express_1.Router)();
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
console.log("ComptRoutes loaded");
ComptRouter.post("/update/profile", authMiddlware_1.authMiddleware, upload.single('profileImage'), Create_1.default);
exports.default = ComptRouter;
