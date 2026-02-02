import crypto from "crypto";
import { bucket } from "../config/fireBase";

export const createFirebaseDownloadUrl = (objectPath: string, token: string) => {
  const encodedPath = encodeURIComponent(objectPath);
  return `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodedPath}?alt=media&token=${token}`;
};

export const uploadBufferToFirebaseStorage = async (args: {
  objectPath: string;
  buffer: Buffer;
  contentType?: string;
  cacheControl?: string;
}) => {
  const token =
    typeof (crypto as any).randomUUID === "function"
      ? (crypto as any).randomUUID()
      : crypto.randomBytes(16).toString("hex");

  const file = bucket.file(args.objectPath);

  await file.save(args.buffer, {
    resumable: false,
    contentType: args.contentType,
    metadata: {
      cacheControl: args.cacheControl ?? "public, max-age=31536000",
      metadata: {
        firebaseStorageDownloadTokens: token,
      },
    },
  });

  return {
    url: createFirebaseDownloadUrl(args.objectPath, token),
    token,
    objectPath: args.objectPath,
  };
};
