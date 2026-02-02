import type { Request, Response } from "express";
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import { uploadBufferToFirebaseStorage } from "../../util/firebaseStorage";

const guessExtension = (mimetype: string) => {
  const mt = String(mimetype || "").toLowerCase();
  if (mt.includes("webm")) return "webm";
  if (mt.includes("ogg")) return "ogg";
  if (mt.includes("wav")) return "wav";
  if (mt.includes("mpeg") || mt.includes("mp3")) return "mp3";
  if (mt.includes("mp4")) return "mp4";
  if (mt.includes("png")) return "png";
  if (mt.includes("jpeg") || mt.includes("jpg")) return "jpg";
  if (mt.includes("gif")) return "gif";
  if (mt.includes("webp")) return "webp";
  if (mt.includes("pdf")) return "pdf";
  return "bin";
};

const INBOX_FIREBASE_PREFIX = "SakhiAyoub/inbox";

export const uploadVoiceMessage = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const file = req.file;
    if (!file) return res.status(400).json({ message: "Missing audio file" });

    const mimetype = String(file.mimetype || "");
    // MediaRecorder often uses audio/webm; accept audio/* and also video/webm for compatibility.
    const isAllowed = mimetype.startsWith("audio/") || mimetype === "video/webm";
    if (!isAllowed) return res.status(400).json({ message: "File must be audio" });

    const maxBytes = 15 * 1024 * 1024;
    if (file.size > maxBytes) {
      return res.status(400).json({ message: "Audio too large (max 15MB)" });
    }

    const ext = guessExtension(mimetype);
    const rand = crypto.randomBytes(8).toString("hex");

    try {
      const objectPath = `${INBOX_FIREBASE_PREFIX}/audios/${userId}/${Date.now()}-${rand}.${ext}`;
      const uploaded = await uploadBufferToFirebaseStorage({
        objectPath,
        buffer: file.buffer,
        contentType: mimetype,
      });

      console.info("[InboxUpload] audio -> firebase", {
        userId,
        objectPath,
        size: file.size,
        mimetype,
      });

      return res.status(200).json({
        url: uploaded.url,
        mimetype,
        size: file.size,
      });
    } catch (err) {
      console.warn("[InboxUpload] audio -> firebase failed, falling back to local", {
        userId,
        size: file.size,
        mimetype,
        error: err instanceof Error ? err.message : String(err),
      });
      // Fallback to local disk if Firebase Storage isn't available.
      const fileName = `${userId}-${Date.now()}-${rand}.${ext}`;
      const outDir = path.join(__dirname, "../../../uploads/voice");
      await fs.mkdir(outDir, { recursive: true });
      await fs.writeFile(path.join(outDir, fileName), file.buffer);
      return res.status(200).json({
        url: `/uploads/voice/${fileName}`,
        mimetype,
        size: file.size,
      });
    }
  } catch {
    return res.status(500).json({ message: "Upload failed" });
  }
};

export const uploadInboxImage = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const file = req.file;
    if (!file) return res.status(400).json({ message: "Missing image file" });

    const mimetype = String(file.mimetype || "");
    if (!mimetype.startsWith("image/")) return res.status(400).json({ message: "File must be an image" });

    const maxBytes = 8 * 1024 * 1024;
    if (file.size > maxBytes) return res.status(400).json({ message: "Image too large (max 8MB)" });

    const ext = guessExtension(mimetype);
    const rand = crypto.randomBytes(8).toString("hex");

    try {
      const objectPath = `${INBOX_FIREBASE_PREFIX}/images/${userId}/${Date.now()}-${rand}.${ext}`;
      const uploaded = await uploadBufferToFirebaseStorage({
        objectPath,
        buffer: file.buffer,
        contentType: mimetype,
      });

      console.info("[InboxUpload] image -> firebase", {
        userId,
        objectPath,
        size: file.size,
        mimetype,
      });

      return res.status(200).json({
        url: uploaded.url,
        mimetype,
        size: file.size,
      });
    } catch (err) {
      console.warn("[InboxUpload] image -> firebase failed, falling back to local", {
        userId,
        size: file.size,
        mimetype,
        error: err instanceof Error ? err.message : String(err),
      });
      const fileName = `${userId}-${Date.now()}-${rand}.${ext}`;
      const outDir = path.join(__dirname, "../../../uploads/inbox/images");
      await fs.mkdir(outDir, { recursive: true });
      await fs.writeFile(path.join(outDir, fileName), file.buffer);
      return res.status(200).json({
        url: `/uploads/inbox/images/${fileName}`,
        mimetype,
        size: file.size,
      });
    }
  } catch {
    return res.status(500).json({ message: "Upload failed" });
  }
};

export const uploadInboxFile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const file = req.file;
    if (!file) return res.status(400).json({ message: "Missing file" });

    const mimetype = String(file.mimetype || "application/octet-stream");
    const maxBytes = 25 * 1024 * 1024;
    if (file.size > maxBytes) return res.status(400).json({ message: "File too large (max 25MB)" });

    const ext = guessExtension(mimetype);
    const rand = crypto.randomBytes(8).toString("hex");

    try {
      const objectPath = `${INBOX_FIREBASE_PREFIX}/files/${userId}/${Date.now()}-${rand}.${ext}`;
      const uploaded = await uploadBufferToFirebaseStorage({
        objectPath,
        buffer: file.buffer,
        contentType: mimetype,
        // Attachments can be large; keep caching reasonable.
        cacheControl: "public, max-age=86400",
      });

      console.info("[InboxUpload] file -> firebase", {
        userId,
        objectPath,
        size: file.size,
        mimetype,
        name: file.originalname,
      });

      return res.status(200).json({
        url: uploaded.url,
        name: file.originalname,
        mimetype,
        size: file.size,
      });
    } catch (err) {
      console.warn("[InboxUpload] file -> firebase failed, falling back to local", {
        userId,
        size: file.size,
        mimetype,
        name: file.originalname,
        error: err instanceof Error ? err.message : String(err),
      });
      const fileName = `${userId}-${Date.now()}-${rand}.${ext}`;
      const outDir = path.join(__dirname, "../../../uploads/inbox/files");
      await fs.mkdir(outDir, { recursive: true });
      await fs.writeFile(path.join(outDir, fileName), file.buffer);
      return res.status(200).json({
        url: `/uploads/inbox/files/${fileName}`,
        name: file.originalname,
        mimetype,
        size: file.size,
      });
    }
  } catch {
    return res.status(500).json({ message: "Upload failed" });
  }
};
