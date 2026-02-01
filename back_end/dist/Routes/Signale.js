"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/reportRoutes.ts
const express_1 = require("express");
const Create_1 = require("../Controllers/Signal/Create");
const authMiddlware_1 = require("../Middleware/authMiddlware");
const blockGuardMiddleware_1 = require("../Middleware/Block/blockGuardMiddleware");
const SignaleRouter = (0, express_1.Router)();
SignaleRouter.post("/", authMiddlware_1.authMiddleware, (0, blockGuardMiddleware_1.blockGuard)(), Create_1.ReportController.createReport);
SignaleRouter.get("/", authMiddlware_1.authMiddleware, (0, blockGuardMiddleware_1.blockGuard)(), Create_1.ReportController.getAllReports);
SignaleRouter.get("/:id", authMiddlware_1.authMiddleware, (0, blockGuardMiddleware_1.blockGuard)(), Create_1.ReportController.getReportById);
SignaleRouter.patch("/:id/status", authMiddlware_1.authMiddleware, (0, blockGuardMiddleware_1.blockGuard)(), Create_1.ReportController.updateReportStatus);
SignaleRouter.delete("/:id", authMiddlware_1.authMiddleware, (0, blockGuardMiddleware_1.blockGuard)(), Create_1.ReportController.deleteReport);
SignaleRouter.get("/user/:userId", authMiddlware_1.authMiddleware, (0, blockGuardMiddleware_1.blockGuard)(), Create_1.ReportController.getReportsByUser);
exports.default = SignaleRouter;
