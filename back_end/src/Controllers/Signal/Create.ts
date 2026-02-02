import { Request, Response } from "express";
import prisma from "../../config/prismaClient";

export class ReportController {
  static async createReport(req: Request, res: Response) {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "Non authentifié" });
    }

    const { reason, description, reported_user_id, post_id, comment_id } = req.body;

    const report = await prisma.report.create({
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
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erreur lors de la création du report" });
  }
}
  static async getAllReports(req: Request, res: Response) {
    try {
      const { status } = req.query;
      const reports = await prisma.report.findMany({
        where: status ? { status: status as any } : {},
        include: {
          reporter: true,
          reportedUser: true,
          post: true,
          comment: true,
        },
        orderBy: { created_at: "desc" },
      });
      res.status(200).json(reports);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Erreur lors de la récupération des reports" });
    }
  }
  static async getReportById(req: Request, res: Response) {
    try {
      const { id } = req.params as { [key: string]: string };
      const report = await prisma.report.findUnique({
        where: { id },
        include: {
          reporter: true,
          reportedUser: true,
          post: true,
          comment: true,
        },
      });
      if (!report) return res.status(404).json({ message: "Report non trouvé" });
      res.status(200).json(report);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Erreur lors de la récupération du report" });
    }
  }
  static async updateReportStatus(req: Request, res: Response) {
    try {
      const { id } = req.params as { [key: string]: string };
      const { status } = req.body;

      const report = await prisma.report.update({
        where: { id },
        data: { status },
      });

      res.status(200).json(report);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Erreur lors de la mise à jour du report" });
    }
  }
  static async deleteReport(req: Request, res: Response) {
    try {
      const { id } = req.params as { [key: string]: string };

      await prisma.report.delete({ where: { id } });

      res.status(200).json({ message: "Report supprimé avec succès" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Erreur lors de la suppression du report" });
    }
  }
  static async getReportsByUser(req: Request, res: Response) {
    try {
      const { userId } = req.params as { [key: string]: string };

      const reportsMade = await prisma.report.findMany({
        where: { reporter_id: userId },
        include: { reportedUser: true, post: true, comment: true },
      });

      const reportsReceived = await prisma.report.findMany({
        where: { reported_user_id: userId },
        include: { reporter: true, post: true, comment: true },
      });

      res.status(200).json({ reportsMade, reportsReceived });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Erreur lors de la récupération des reports de l'utilisateur" });
    }
  }
}
