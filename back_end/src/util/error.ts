import { Request, Response, NextFunction } from 'express';
import { logger } from './logger';

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
  }

  // Erreur Prisma
  if (err.name === 'PrismaClientKnownRequestError') {
    return res.status(400).json({
      success: false,
      message: 'Erreur de base de données',
      ...(process.env.NODE_ENV === 'development' && { details: err.message }),
    });
  }

  // Erreur de validation
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  // Erreur par défaut
  logger.error({ err, path: req.originalUrl, method: req.method }, 'unhandled error');
  return res.status(500).json({
    success: false,
    message: 'Une erreur interne est survenue',
    ...(process.env.NODE_ENV === 'development' && { error: err.message }),
  });
};