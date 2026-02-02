"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportController = void 0;
const prismaClient_1 = __importDefault(require("../../config/prismaClient"));
class ReportController {
    static async createReport(req, res) {
        try {
            if (!req.user?.id) {
                return res.status(401).json({ message: "Non authentifié" });
            }
            const { reason, description, reported_user_id, post_id, comment_id } = req.body;
            const report = await prismaClient_1.default.report.create({
                data: {
                    reason,
                    description,
                    reporter_id: req.user.id,
                    reported_user_id,
                    post_id: post_id ?? null,
                    comment_id: comment_id ?? null,
                },
            });
            return res.status(201).json(report);
        }
        catch (err) {
            console.error(err);
            return res.status(500).json({ message: "Erreur lors de la création du report" });
        }
    }
    static async getAllReports(req, res) {
        try {
            const { status } = req.query;
            const reports = await prismaClient_1.default.report.findMany({
                where: status ? { status: status } : {},
                include: {
                    reporter: true,
                    reportedUser: true,
                    post: true,
                    comment: true,
                },
                orderBy: { created_at: "desc" },
            });
            res.status(200).json(reports);
        }
        catch (err) {
            console.error(err);
            res.status(500).json({ message: "Erreur lors de la récupération des reports" });
        }
    }
    static async getReportById(req, res) {
        try {
            const { id } = req.params;
            const report = await prismaClient_1.default.report.findUnique({
                where: { id },
                include: {
                    reporter: true,
                    reportedUser: true,
                    post: true,
                    comment: true,
                },
            });
            if (!report)
                return res.status(404).json({ message: "Report non trouvé" });
            res.status(200).json(report);
        }
        catch (err) {
            console.error(err);
            res.status(500).json({ message: "Erreur lors de la récupération du report" });
        }
    }
    static async updateReportStatus(req, res) {
        try {
            const { id } = req.params;
            const { status } = req.body;
            const report = await prismaClient_1.default.report.update({
                where: { id },
                data: { status },
            });
            res.status(200).json(report);
        }
        catch (err) {
            console.error(err);
            res.status(500).json({ message: "Erreur lors de la mise à jour du report" });
        }
    }
    static async deleteReport(req, res) {
        try {
            const { id } = req.params;
            await prismaClient_1.default.report.delete({ where: { id } });
            res.status(200).json({ message: "Report supprimé avec succès" });
        }
        catch (err) {
            console.error(err);
            res.status(500).json({ message: "Erreur lors de la suppression du report" });
        }
    }
    static async getReportsByUser(req, res) {
        try {
            const { userId } = req.params;
            const reportsMade = await prismaClient_1.default.report.findMany({
                where: { reporter_id: userId },
                include: { reportedUser: true, post: true, comment: true },
            });
            const reportsReceived = await prismaClient_1.default.report.findMany({
                where: { reported_user_id: userId },
                include: { reporter: true, post: true, comment: true },
            });
            res.status(200).json({ reportsMade, reportsReceived });
        }
        catch (err) {
            console.error(err);
            res.status(500).json({ message: "Erreur lors de la récupération des reports de l'utilisateur" });
        }
    }
}
exports.ReportController = ReportController;
