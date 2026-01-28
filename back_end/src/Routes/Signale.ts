// src/routes/reportRoutes.ts
import { Router } from "express";
import { ReportController } from "../Controllers/Signal/Create";
import { authMiddleware } from "../Middleware/authMiddlware";

import { blockGuard } from "../Middleware/Block/blockGuardMiddleware";

const SignaleRouter = Router();

SignaleRouter.post("/", authMiddleware, blockGuard(), ReportController.createReport);
SignaleRouter.get("/", authMiddleware, blockGuard(), ReportController.getAllReports);
SignaleRouter.get("/:id", authMiddleware, blockGuard(), ReportController.getReportById);
SignaleRouter.patch("/:id/status", authMiddleware, blockGuard(), ReportController.updateReportStatus);
SignaleRouter.delete("/:id", authMiddleware, blockGuard(), ReportController.deleteReport);
SignaleRouter.get("/user/:userId", authMiddleware, blockGuard(), ReportController.getReportsByUser);

export default SignaleRouter;
