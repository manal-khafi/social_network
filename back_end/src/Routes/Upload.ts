import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import multer from "multer";
import os from "os";
import { authMiddleware } from "../Middleware/authMiddlware";
import { uploadFile } from "../Controllers/upload.controller";

const UploadRouter = Router();

// Matches the largest file the frontend allows (100 MB video). Files are
// spooled to the OS temp dir rather than kept in memory.
const MAX_UPLOAD_BYTES = 100 * 1024 * 1024;
const upload = multer({
  dest: os.tmpdir(),
  limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 },
});

const receiveFile = (req: Request, res: Response, next: NextFunction) => {
  upload.single("file")(req, res, (err: unknown) => {
    if (err instanceof multer.MulterError) {
      const tooLarge = err.code === "LIMIT_FILE_SIZE";
      return res
        .status(tooLarge ? 413 : 400)
        .json({ message: tooLarge ? "File too large (max 100MB)" : err.message });
    }
    if (err) return next(err);
    next();
  });
};

UploadRouter.post("/", authMiddleware, receiveFile, uploadFile);

export default UploadRouter;
