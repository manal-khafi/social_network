import { Request, Response, NextFunction } from 'express';
import { AppError } from '../util/error';

export const validateStoryCreation = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { content_url, content_type, visibility } = req.body;

  if (!content_url || typeof content_url !== 'string') {
    return next(new AppError('Le contenu de la story est requis', 400));
  }

  if (!content_type || !['image', 'video', 'text', 'link'].includes(content_type)) {
    return next(new AppError('Type de contenu invalide', 400));
  }

  if (!visibility || !['public', 'friends', 'close_friends'].includes(visibility)) {
    return next(new AppError('Visibilité invalide', 400));
  }

  next();
};

export const validateStoryComment = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { content } = req.body;

  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    return next(new AppError('Le contenu du commentaire est requis', 400));
  }

  if (content.length > 500) {
    return next(new AppError('Le commentaire ne peut pas dépasser 500 caractères', 400));
  }

  next();
};

export const validateStoryMessage = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { content, recipient_id } = req.body;

  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    return next(new AppError('Le contenu du message est requis', 400));
  }

  if (!recipient_id || typeof recipient_id !== 'string') {
    return next(new AppError('Le destinataire est requis', 400));
  }

  next();
};