// src/routes/reportRoutes.ts
import { Router } from "express";
import { ReportController } from "../Controllers/Signale/Create";
import { authMiddleware } from "../Middlware/authMiddlware";

const SignaleRouter = Router();

SignaleRouter.post("/", authMiddleware, ReportController.createReport);
SignaleRouter.get("/", authMiddleware, ReportController.getAllReports);
SignaleRouter.get("/:id", authMiddleware, ReportController.getReportById);
SignaleRouter.patch("/:id/status", authMiddleware, ReportController.updateReportStatus);
SignaleRouter.delete("/:id", authMiddleware, ReportController.deleteReport);
SignaleRouter.get("/user/:userId", authMiddleware, ReportController.getReportsByUser);

export default SignaleRouter;
