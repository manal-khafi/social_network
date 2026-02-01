"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateStoryMessage = exports.validateStoryComment = exports.validateStoryCreation = void 0;
const error_1 = require("../util/error");
const validateStoryCreation = (req, res, next) => {
    const { content_url, content_type, visibility } = req.body;
    if (!content_url || typeof content_url !== 'string') {
        return next(new error_1.AppError('Le contenu de la story est requis', 400));
    }
    if (!content_type || !['image', 'video', 'text', 'link'].includes(content_type)) {
        return next(new error_1.AppError('Type de contenu invalide', 400));
    }
    if (!visibility || !['public', 'friends', 'close_friends'].includes(visibility)) {
        return next(new error_1.AppError('Visibilité invalide', 400));
    }
    next();
};
exports.validateStoryCreation = validateStoryCreation;
const validateStoryComment = (req, res, next) => {
    const { content } = req.body;
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
        return next(new error_1.AppError('Le contenu du commentaire est requis', 400));
    }
    if (content.length > 500) {
        return next(new error_1.AppError('Le commentaire ne peut pas dépasser 500 caractères', 400));
    }
    next();
};
exports.validateStoryComment = validateStoryComment;
const validateStoryMessage = (req, res, next) => {
    const { content, recipient_id } = req.body;
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
        return next(new error_1.AppError('Le contenu du message est requis', 400));
    }
    if (!recipient_id || typeof recipient_id !== 'string') {
        return next(new error_1.AppError('Le destinataire est requis', 400));
    }
    next();
};
exports.validateStoryMessage = validateStoryMessage;
