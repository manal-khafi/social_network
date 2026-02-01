"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.AppError = void 0;
class AppError extends Error {
    constructor(message, statusCode = 500) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
const errorHandler = (err, req, res, next) => {
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
    console.error('Erreur non gérée:', err);
    return res.status(500).json({
        success: false,
        message: 'Une erreur interne est survenue',
        ...(process.env.NODE_ENV === 'development' && { error: err.message }),
    });
};
exports.errorHandler = errorHandler;
