import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { storage } from "../config/firebaseConfig";

const INBOX_ROOT = "SakhiAyoub/inbox";

type InboxFolder = "audios" | "images" | "files";

const safeExtFromMime = (mime: string | undefined) => {
  const mt = String(mime || "").toLowerCase();
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

const safeRandom = () => {
  try {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) return (crypto as any).randomUUID();
  } catch {
    // ignore
  }
  return Math.random().toString(16).slice(2);
};

const buildPath = (folder: InboxFolder, userId: string, ext: string) => {
  // Note: Firebase Storage object paths do NOT start with '/'.
  return `${INBOX_ROOT}/${folder}/${userId}/${Date.now()}-${safeRandom()}.${ext}`;
};

const uploadToInbox = async (args: {
  folder: InboxFolder;
  data: Blob;
  userId: string;
  contentType?: string;
  extHint?: string;
}) => {
  const ext = args.extHint || safeExtFromMime(args.contentType);
  const objectPath = buildPath(args.folder, args.userId, ext);

  const fileRef = ref(storage, objectPath);
  await uploadBytes(fileRef, args.data, args.contentType ? { contentType: args.contentType } : undefined);
  const url = await getDownloadURL(fileRef);

  console.info("[InboxStorage] Uploaded", { folder: args.folder, objectPath });
  return { url, objectPath };
};

export const uploadInboxAudio = async (blob: Blob, userId: string) => {
  return uploadToInbox({
    folder: "audios",
    data: blob,
    userId,
    contentType: blob.type || "audio/webm",
    extHint: safeExtFromMime(blob.type || "audio/webm"),
  });
};

export const uploadInboxImage = async (file: File, userId: string) => {
  const extFromName = file.name?.includes(".") ? file.name.split(".").pop() : undefined;
  return uploadToInbox({
    folder: "images",
    data: file,
    userId,
    contentType: file.type || "image/*",
    extHint: (extFromName && String(extFromName).toLowerCase()) || safeExtFromMime(file.type),
  });
};

export const uploadInboxFile = async (file: File, userId: string) => {
  const extFromName = file.name?.includes(".") ? file.name.split(".").pop() : undefined;
  return uploadToInbox({
    folder: "files",
    data: file,
    userId,
    contentType: file.type || "application/octet-stream",
    extHint: (extFromName && String(extFromName).toLowerCase()) || safeExtFromMime(file.type),
  });
};
