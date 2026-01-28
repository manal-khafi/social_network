export const isVideoUrl = (url?: string) => {
  if (!url) return false;

  if (url.startsWith('data:video/')) return true;

  return /\.(mp4|webm|ogg)(\?|#|$)/i.test(url);
};
