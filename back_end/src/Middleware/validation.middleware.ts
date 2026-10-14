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
    return next(new AppError('Story content is required', 400));
  }

  if (!content_type || !['image', 'video', 'text', 'link'].includes(content_type)) {
    return next(new AppError('Invalid content type', 400));
  }

  if (visibility && !['public', 'friends', 'close_friends'].includes(visibility)) {
    return next(new AppError('Invalid visibility', 400));
  }

  if (caption != null && (typeof caption !== 'string' || caption.length > 2200)) {
    return next(new AppError('Invalid caption', 400));
  }

  if (overlays != null && !Array.isArray(overlays)) {
    return next(new AppError('Invalid overlays format', 400));
  }
  if (Array.isArray(overlays)) {
    if (overlays.length > 30) {
      return next(new AppError('Too many items on the story (max 30)', 400));
    }
    for (const ov of overlays) {
      if (!ov || typeof ov !== 'object' || typeof ov.id !== 'string') {
        return next(new AppError('Invalid overlay', 400));
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
          return next(new AppError('Invalid poll (question + 2 to 4 options)', 400));
        }
      }
      if (ov.type === 'link') {
        if (typeof ov.url !== 'string' || !/^https?:\/\//i.test(ov.url)) {
          return next(new AppError('Invalid link (http/https required)', 400));
        }
      }
      if (ov.type === 'question') {
        if (typeof ov.prompt !== 'string' || !ov.prompt.trim() || ov.prompt.length > 200) {
          return next(new AppError('Invalid question', 400));
        }
      }
      if (ov.type === 'mention') {
        if (typeof ov.text !== 'string' || !ov.text.trim()) {
          return next(new AppError('Invalid mention', 400));
        }
      }
      if (ov.type === 'drawing') {
        if (typeof ov.drawingUrl !== 'string' || !/^https:\/\//i.test(ov.drawingUrl)) {
          return next(new AppError('Invalid drawing', 400));
        }
      }
      if (ov.type === 'gif') {
        if (typeof ov.gifUrl !== 'string' || !/^https:\/\//i.test(ov.gifUrl)) {
          return next(new AppError('Invalid GIF', 400));
        }
      }
    }
  }

  if (music != null) {
    if (typeof music !== 'object' || Array.isArray(music)) {
      return next(new AppError('Invalid music format', 400));
    }
    if (music.preview_url && typeof music.preview_url !== 'string') {
      return next(new AppError('Invalid music preview URL', 400));
    }
  }

  if (
    duration_hours != null &&
    (typeof duration_hours !== 'number' || duration_hours < 1 || duration_hours > 168)
  ) {
    return next(new AppError('Invalid duration (1 to 168 hours)', 400));
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
    return next(new AppError('Emoji required', 400));
  }
  if ([...emoji.trim()].length > 4) {
    return next(new AppError('Invalid emoji', 400));
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
    return next(new AppError('At least one recipient is required', 400));
  }
  if (recipient_ids.length > 25) {
    return next(new AppError('Too many recipients (max 25)', 400));
  }
  if (!recipient_ids.every((id) => typeof id === 'string' && id.length > 0)) {
    return next(new AppError('Invalid recipient list', 400));
  }
  if (note != null && (typeof note !== 'string' || note.length > 1000)) {
    return next(new AppError('Message is too long', 400));
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
    return next(new AppError('Comment content is required', 400));
  }

  if (content.length > 500) {
    return next(new AppError('Comment cannot exceed 500 characters', 400));
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
    return next(new AppError('Message content is required', 400));
  }

  // recipient_id is optional — defaults to the story author server-side.
  if (recipient_id != null && typeof recipient_id !== 'string') {
    return next(new AppError('Invalid recipient', 400));
  }

  next();
};