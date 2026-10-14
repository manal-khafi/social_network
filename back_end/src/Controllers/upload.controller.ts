import type { Request, Response } from "express";
import { randomUUID } from "crypto";
import fs from "fs/promises";
import path from "path";
import { bucket } from "../config/fireBase";

const ALLOWED_FOLDERS = ["avatars", "covers", "posts", "stories", "communities", "voice"];
const ALLOWED_TYPES = ["image/", "video/", "audio/"];

/**
 * Uploads one image / video / audio recording to Firebase Storage with the Admin SDK and returns
 * its download URL. Going through the API (instead of the browser writing to
 * Storage directly) means the upload is authorized by the backend JWT, so it
 * works for email/password users as well as Google ones.
 *
 * multer has already written the file to a temp path (see Routes/Upload.ts);
 * it is always removed once the request is done.
 */
export const uploadFile = async (req: Request, res: Response) => {
  const file = req.file;

  try {
    if (!file) {
      return res.status(400).json({ message: "No file provided" });
    }

    if (!ALLOWED_TYPES.some((type) => file.mimetype.startsWith(type))) {
      return res.status(400).json({ message: "File must be an image, a video or an audio recording" });
    }

    const folder = req.body?.folder;
    if (!ALLOWED_FOLDERS.includes(folder)) {
      return res.status(400).json({ message: "Invalid upload folder" });
    }

    if (!bucket) {
      return res.status(503).json({ message: "File storage is not configured" });
    }

    const rawExt = path.extname(file.originalname).toLowerCase();
    const ext = /^\.[a-z0-9]{1,5}$/.test(rawExt) ? rawExt : "";
    const destination = `users/${req.user!.id}/${folder}/${Date.now()}-${randomUUID()}${ext}`;

    // Same tokenised URL the client SDK's getDownloadURL() returns, so the
    // object does not have to be made public.
    const token = randomUUID();
    await bucket.upload(file.path, {
      destination,
      metadata: {
        contentType: file.mimetype,
        metadata: { firebaseStorageDownloadTokens: token },
      },
    });

    const url = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(
      destination
    )}?alt=media&token=${token}`;

    return res.status(201).json({ url });
  } finally {
    if (file) await fs.unlink(file.path).catch(() => undefined);
  }
};
