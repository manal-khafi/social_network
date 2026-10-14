// src/routes/reportRoutes.ts
import { Router } from "express";
import { ReportController } from "../Controllers/Signal/Create";
import { authMiddleware } from "../Middleware/authMiddlware";
import { requireAdmin } from "../Middleware/requireRole";

import { blockGuard } from "../Middleware/Block/blockGuardMiddleware";

const SignaleRouter = Router();

// Any authenticated user can file a report.
SignaleRouter.post("/", authMiddleware, blockGuard(), ReportController.createReport);

// Reading and moderating reports is admin-only.
SignaleRouter.get("/", authMiddleware, requireAdmin, ReportController.getAllReports);
SignaleRouter.get("/:id", authMiddleware, requireAdmin, ReportController.getReportById);
SignaleRouter.patch("/:id/status", authMiddleware, requireAdmin, ReportController.updateReportStatus);
SignaleRouter.delete("/:id", authMiddleware, requireAdmin, ReportController.deleteReport);
SignaleRouter.get("/user/:userId", authMiddleware, requireAdmin, ReportController.getReportsByUser);

export default SignaleRouter;
