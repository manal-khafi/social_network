import { useEffect, useRef, useState } from 'react';
import { Heart, Maximize2, Pause, Play } from 'lucide-react';

interface VideoPlayerProps {
  src: string;
  onDoubleTapLike?: () => void;
  className?: string;
}

const formatTime = (seconds: number) => {
  if (!Number.isFinite(seconds) || seconds <= 0) return '0:00';
  const totalSeconds = Math.floor(seconds);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${minutes}:${String(secs).padStart(2, '0')}`;
};

export default function VideoPlayer({ src, onDoubleTapLike, className }: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const clickTimeoutRef = useRef<number | null>(null);
  const lastTapRef = useRef<number>(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showHeart, setShowHeart] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    return () => {
      if (clickTimeoutRef.current) {
        window.clearTimeout(clickTimeoutRef.current);
      }
    };
  }, []);

  const togglePlay = async () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      try {
        await video.play();
        setIsPlaying(true);
      } catch {
        setIsPlaying(false);
      }
      return;
    }

    video.pause();
    setIsPlaying(false);
  };

  const handleDoubleTap = () => {
    onDoubleTapLike?.();
    setShowHeart(true);
    window.setTimeout(() => setShowHeart(false), 600);
  };

  const handleTap = () => {
    const now = Date.now();
    const delta = now - lastTapRef.current;

    if (delta < 260) {
      if (clickTimeoutRef.current) {
        window.clearTimeout(clickTimeoutRef.current);
        clickTimeoutRef.current = null;
      }
      lastTapRef.current = 0;
      handleDoubleTap();
      return;
    }

    lastTapRef.current = now;
    clickTimeoutRef.current = window.setTimeout(() => {
      togglePlay();
      clickTimeoutRef.current = null;
    }, 260);
  };

  const handleFullscreen = async () => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      await container.requestFullscreen();
      return;
    }

    if (document.fullscreenElement) {
      await document.exitFullscreen();
    }
  };

  const handleSeek = (value: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = value;
    setCurrentTime(value);
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full overflow-hidden rounded-lg bg-black aspect-video max-h-96 ${className ?? ''}`}
      onClick={handleTap}
    >
      <video
        ref={videoRef}
        src={src}
        className="h-full w-full object-contain"
        playsInline
        preload="metadata"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
        onLoadedMetadata={() => {
          const video = videoRef.current;
          if (video) {
            setDuration(video.duration || 0);
          }
        }}
        onTimeUpdate={() => {
          const video = videoRef.current;
          if (video) {
            setCurrentTime(video.currentTime);
          }
        }}
      />

      {showHeart && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <Heart className="h-16 w-16 text-white drop-shadow-lg fill-red-500" />
        </div>
      )}

      <div className="absolute inset-0 flex items-center justify-center">
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            togglePlay();
          }}
          className="rounded-full bg-black/50 p-3 text-white hover:bg-black/70 transition-opacity"
          aria-label={isPlaying ? 'Pause video' : 'Play video'}
        >
          {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
        </button>
      </div>

      <div
        className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-3 pb-2 pt-6"
        onClick={(event) => event.stopPropagation()}
      >
        <input
          type="range"
          min={0}
          max={duration || 0}
          step={0.01}
          value={Math.min(currentTime, duration || 0)}
          onChange={(event) => handleSeek(Number(event.target.value))}
          className="w-full accent-red-500"
          aria-label="Seek video"
        />
        <div className="mt-1 flex items-center justify-between text-xs text-white">
          <span>{formatTime(currentTime)}</span>
          <div className="flex items-center gap-3">
            <span>{formatTime(duration)}</span>
            <button
              type="button"
              onClick={handleFullscreen}
              className="rounded-full bg-black/40 p-1.5 text-white hover:bg-black/60"
              aria-label="Toggle fullscreen"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
