import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { storage, auth } from "../config/firebaseConfig";

export interface UploadedStoryMedia {
  url: string;
  type: "image" | "video";
  durationSec?: number;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
}

const MAX_IMAGE_BYTES = 25 * 1024 * 1024; // pre-compression
const MAX_VIDEO_BYTES = 100 * 1024 * 1024;
const MAX_VIDEO_SEC = 90;
const TARGET_LONG_EDGE = 1440; // story canvas is ~1080 wide; keep some headroom

/**
 * Downscale + re-encode a large photo to a story-sized JPEG so we're not
 * uploading (and later downloading) a 20 MP camera original.
 */
async function compressImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return file;

  const { width, height } = bitmap;
  const longEdge = Math.max(width, height);
  const scale = longEdge > TARGET_LONG_EDGE ? TARGET_LONG_EDGE / longEdge : 1;

  // Nothing to gain: small image and already a reasonable size.
  if (scale === 1 && file.size < 1.5 * 1024 * 1024) {
    bitmap.close?.();
    return file;
  }

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close?.();
    return file;
  }
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close?.();

  const blob: Blob = await new Promise((resolve) =>
    canvas.toBlob((b) => resolve(b ?? file), "image/jpeg", 0.85)
  );
  // Only keep the compressed version if it actually helped.
  return blob.size < file.size ? blob : file;
}

function readVideoMeta(file: File): Promise<{ duration: number; width: number; height: number; poster: Blob | null }> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;
    const objectUrl = URL.createObjectURL(file);
    video.src = objectUrl;

    const cleanup = () => URL.revokeObjectURL(objectUrl);

    video.onloadedmetadata = () => {
      const duration = video.duration || 0;
      const width = video.videoWidth;
      const height = video.videoHeight;
      // Seek a touch in to grab a non-black poster frame.
      video.currentTime = Math.min(0.1, duration / 2);
      video.onseeked = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            cleanup();
            return resolve({ duration, width, height, poster: null });
          }
          ctx.drawImage(video, 0, 0, width, height);
          canvas.toBlob(
            (blob) => {
              cleanup();
              resolve({ duration, width, height, poster: blob });
            },
            "image/jpeg",
            0.8
          );
        } catch {
          cleanup();
          resolve({ duration, width, height, poster: null });
        }
      };
    };

    video.onerror = () => {
      cleanup();
      reject(new Error("Impossible de lire cette vidéo"));
    };
  });
}

function readImageSize(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ width: 0, height: 0 });
    };
    img.src = url;
  });
}

/**
 * Uploads a story image or video to Firebase Storage and returns its URL plus
 * metadata (duration + a poster frame for videos).
 */
export async function uploadStoryMedia(
  file: File,
  ownerId?: string
): Promise<UploadedStoryMedia> {
  // Email/password users authenticate via the backend JWT, not Firebase, so
  // fall back to the app user id (or "anon") for the storage path.
  const uid = auth.currentUser?.uid ?? ownerId ?? "anon";

  const isVideo = file.type.startsWith("video/");
  const isImage = file.type.startsWith("image/");
  if (!isVideo && !isImage) throw new Error("Choisissez une image ou une vidéo");
  if (isImage && file.size > MAX_IMAGE_BYTES) throw new Error("Image trop lourde (max 25 Mo)");
  if (isVideo && file.size > MAX_VIDEO_BYTES) throw new Error("Vidéo trop lourde (max 100 Mo)");

  const base = `users/${uid}/stories/${Date.now()}-${Math.random().toString(36).slice(2)}`;

  if (isImage) {
    const { width, height } = await readImageSize(file);
    const compressed = await compressImage(file);
    const fileRef = ref(storage, `${base}.jpg`);
    await uploadBytes(fileRef, compressed, { contentType: "image/jpeg" });
    const url = await getDownloadURL(fileRef);
    return { url, type: "image", width, height };
  }

  // Read metadata first so we can reject an over-long clip before uploading it.
  const meta = await readVideoMeta(file);
  if (meta.duration && meta.duration > MAX_VIDEO_SEC) {
    throw new Error(
      `Vidéo trop longue (${Math.round(meta.duration)}s, max ${MAX_VIDEO_SEC}s). Raccourcissez-la puis réessayez.`
    );
  }

  const ext = file.name.split(".").pop() || "mp4";
  const fileRef = ref(storage, `${base}.${ext}`);
  await uploadBytes(fileRef, file);
  const url = await getDownloadURL(fileRef);

  let thumbnailUrl: string | undefined;
  if (meta.poster) {
    const posterRef = ref(storage, `${base}-poster.jpg`);
    await uploadBytes(posterRef, meta.poster);
    thumbnailUrl = await getDownloadURL(posterRef);
  }

  return {
    url,
    type: "video",
    durationSec: Math.round(meta.duration) || undefined,
    thumbnailUrl,
    width: meta.width,
    height: meta.height,
  };
}
