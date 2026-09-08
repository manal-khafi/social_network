import { Request, Response, NextFunction } from 'express';
import { AppError } from '../util/error';

export const validateStoryCreation = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { content_url, content_type, visibility, caption, overlays, music, duration_hours } =
    req.body;

  if (!content_url || typeof content_url !== 'string') {
    return next(new AppError('Le contenu de la story est requis', 400));
  }

  if (!content_type || !['image', 'video', 'text', 'link'].includes(content_type)) {
    return next(new AppError('Type de contenu invalide', 400));
  }

  if (visibility && !['public', 'friends', 'close_friends'].includes(visibility)) {
    return next(new AppError('Visibilité invalide', 400));
  }

  if (caption != null && (typeof caption !== 'string' || caption.length > 2200)) {
    return next(new AppError('Légende invalide', 400));
  }

  if (overlays != null && !Array.isArray(overlays)) {
    return next(new AppError('Format des overlays invalide', 400));
  }
  if (Array.isArray(overlays)) {
    if (overlays.length > 30) {
      return next(new AppError('Trop d\'éléments sur la story (max 30)', 400));
    }
    for (const ov of overlays) {
      if (!ov || typeof ov !== 'object' || typeof ov.id !== 'string') {
        return next(new AppError('Overlay invalide', 400));
      }
      if (ov.type === 'poll') {
        const opts = ov.options;
        if (
          typeof ov.question !== 'string' ||
          !ov.question.trim() ||
          !Array.isArray(opts) ||
          opts.length < 2 ||
          opts.length > 4 ||
          !opts.every((o: unknown) => typeof o === 'string' && (o as string).trim().length > 0)
        ) {
          return next(new AppError('Sondage invalide (question + 2 à 4 options)', 400));
        }
      }
      if (ov.type === 'link') {
        if (typeof ov.url !== 'string' || !/^https?:\/\//i.test(ov.url)) {
          return next(new AppError('Lien invalide (http/https requis)', 400));
        }
      }
    }
  }

  if (music != null) {
    if (typeof music !== 'object' || Array.isArray(music)) {
      return next(new AppError('Format de la musique invalide', 400));
    }
    if (music.preview_url && typeof music.preview_url !== 'string') {
      return next(new AppError('URL de prévisualisation musicale invalide', 400));
    }
  }

  if (
    duration_hours != null &&
    (typeof duration_hours !== 'number' || duration_hours < 1 || duration_hours > 168)
  ) {
    return next(new AppError('Durée invalide (1 à 168 heures)', 400));
  }

  next();
};

export const validateStoryReaction = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { emoji } = req.body;
  if (!emoji || typeof emoji !== 'string' || [...emoji.trim()].length === 0) {
    return next(new AppError('Emoji requis', 400));
  }
  if ([...emoji.trim()].length > 4) {
    return next(new AppError('Emoji invalide', 400));
  }
  next();
};

export const validateStoryShare = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { recipient_ids, note } = req.body;
  if (!Array.isArray(recipient_ids) || recipient_ids.length === 0) {
    return next(new AppError('Au moins un destinataire est requis', 400));
  }
  if (recipient_ids.length > 25) {
    return next(new AppError('Trop de destinataires (max 25)', 400));
  }
  if (!recipient_ids.every((id) => typeof id === 'string' && id.length > 0)) {
    return next(new AppError('Liste de destinataires invalide', 400));
  }
  if (note != null && (typeof note !== 'string' || note.length > 1000)) {
    return next(new AppError('Message trop long', 400));
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

  // recipient_id is optional — defaults to the story author server-side.
  if (recipient_id != null && typeof recipient_id !== 'string') {
    return next(new AppError('Le destinataire est invalide', 400));
  }

  next();
};