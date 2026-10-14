import { uploadFile, type UploadFolder } from "../api/upload";

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
      const seekTo = Number.isFinite(duration) ? Math.min(0.1, duration / 2) : 0.1;
      const width = video.videoWidth;
      const height = video.videoHeight;
      // Seek a touch in to grab a non-black poster frame.
      video.currentTime = seekTo;
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
      reject(new Error("Could not read this video"));
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
 * Uploads an image or video through the backend (see api/upload.ts) and
 * returns its URL plus metadata (image downscaled to a sane size; videos
 * get a poster frame + duration and are rejected past MAX_VIDEO_SEC).
 */
export async function uploadMedia(
  file: File,
  folder: UploadFolder,
  /** Length of a clip recorded in the browser: MediaRecorder files often report none. */
  knownDurationSec?: number
): Promise<UploadedStoryMedia> {
  const isVideo = file.type.startsWith("video/");
  const isImage = file.type.startsWith("image/");
  if (!isVideo && !isImage) throw new Error("Choose an image or a video");
  if (isImage && file.size > MAX_IMAGE_BYTES) throw new Error("Image is too large (max 25 MB)");
  if (isVideo && file.size > MAX_VIDEO_BYTES) throw new Error("Video is too large (max 100 MB)");

  if (isImage) {
    const { width, height } = await readImageSize(file);
    const compressed = await compressImage(file);
    const url = await uploadFile(compressed, folder, "image.jpg");
    return { url, type: "image", width, height };
  }

  // Read metadata first so we can reject an over-long clip before uploading it.
  const meta = await readVideoMeta(file);
  if (!Number.isFinite(meta.duration)) meta.duration = knownDurationSec ?? 0;
  if (meta.duration && meta.duration > MAX_VIDEO_SEC) {
    throw new Error(
      `Video is too long (${Math.round(meta.duration)}s, max ${MAX_VIDEO_SEC}s). Trim it and try again.`
    );
  }

  const url = await uploadFile(file, folder);

  let thumbnailUrl: string | undefined;
  if (meta.poster) {
    thumbnailUrl = await uploadFile(meta.poster, folder, "poster.jpg");
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

/** Story media (folder: stories). */
export const uploadStoryMedia = (file: File, knownDurationSec?: number) =>
  uploadMedia(file, "stories", knownDurationSec);

/** Post media (folder: posts). */
export const uploadPostMedia = (file: File) => uploadMedia(file, "posts");
