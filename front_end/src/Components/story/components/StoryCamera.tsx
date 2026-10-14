import { useEffect, useRef, useState } from "react";
import { X, Image as ImageIcon, RefreshCw, Type, Loader2, CameraOff } from "lucide-react";
import { useTranslation } from "react-i18next";

const HOLD_TO_RECORD_MS = 300;
const MAX_RECORD_SEC = 60;

interface StoryCameraProps {
  /** A photo or a recorded clip (with its length, which browsers often can't read back). */
  onCapture: (file: File, durationSec?: number) => void;
  onPickGallery: () => void;
  onTextMode: () => void;
  onClose: () => void;
  uploading: boolean;
}

type CameraState = "starting" | "ready" | "unavailable";

/**
 * Full-screen camera (Instagram style): tap the shutter for a photo, hold it to
 * record a video. Falls back to the gallery when there is no camera or access
 * is denied.
 */
export default function StoryCamera({ onCapture, onPickGallery, onTextMode, onClose, uploading }: StoryCameraProps) {
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const holdTimerRef = useRef<number | null>(null);
  const tickRef = useRef<number | null>(null);
  const recordStartRef = useRef(0);

  const [facing, setFacing] = useState<"user" | "environment">("environment");
  const [state, setState] = useState<CameraState>("starting");
  const [canFlip, setCanFlip] = useState(false);
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  // (Re)open the camera for the current facing mode; release it on change / unmount.
  useEffect(() => {
    let cancelled = false;
    const open = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setState("unavailable");
        return;
      }
      setState("starting");
      const video = { facingMode: { ideal: facing }, width: { ideal: 1080 }, height: { ideal: 1920 } };
      let stream: MediaStream;
      try {
        // Ask for the microphone too, so held recordings have sound…
        stream = await navigator.mediaDevices.getUserMedia({ video, audio: true });
      } catch {
        try {
          // …but a camera without a microphone still takes photos and silent clips.
          stream = await navigator.mediaDevices.getUserMedia({ video, audio: false });
        } catch {
          if (!cancelled) setState("unavailable");
          return;
        }
      }
      if (cancelled) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
      setState("ready");
      navigator.mediaDevices
        .enumerateDevices()
        .then((devices) => !cancelled && setCanFlip(devices.filter((d) => d.kind === "videoinput").length > 1))
        .catch(() => {});
    };
    open();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, [facing]);

  // Never leave a timer or a recorder running after unmount.
  useEffect(
    () => () => {
      if (holdTimerRef.current !== null) window.clearTimeout(holdTimerRef.current);
      if (tickRef.current !== null) window.clearInterval(tickRef.current);
      if (recorderRef.current?.state === "recording") {
        recorderRef.current.onstop = null;
        recorderRef.current.stop();
      }
    },
    []
  );

  const mirrored = facing === "user";

  const takePhoto = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    // Save what the user saw: the front camera preview is mirrored.
    if (mirrored) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => blob && onCapture(new File([blob], "photo.jpg", { type: "image/jpeg" })),
      "image/jpeg",
      0.92
    );
  };

  const stopRecording = () => {
    if (tickRef.current !== null) window.clearInterval(tickRef.current);
    tickRef.current = null;
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
    setRecording(false);
  };

  const startRecording = () => {
    const stream = streamRef.current;
    if (!stream || typeof MediaRecorder === "undefined") return takePhoto();
    const mimeType = ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm", "video/mp4"].find(
      (type) => MediaRecorder.isTypeSupported(type)
    );
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    chunksRef.current = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.onstop = () => {
      const seconds = Math.max(1, Math.round((Date.now() - recordStartRef.current) / 1000));
      const type = (recorder.mimeType || mimeType || "video/webm").split(";")[0];
      const blob = new Blob(chunksRef.current, { type });
      chunksRef.current = [];
      if (blob.size > 0) {
        onCapture(new File([blob], `video.${type.includes("mp4") ? "mp4" : "webm"}`, { type }), seconds);
      }
    };
    recorderRef.current = recorder;
    recordStartRef.current = Date.now();
    recorder.start();
    setElapsed(0);
    setRecording(true);
    tickRef.current = window.setInterval(() => {
      const s = (Date.now() - recordStartRef.current) / 1000;
      setElapsed(s);
      if (s >= MAX_RECORD_SEC) stopRecording();
    }, 100);
  };

  // Tap = photo, hold = video.
  const onShutterDown = () => {
    if (state !== "ready" || uploading) return;
    holdTimerRef.current = window.setTimeout(() => {
      holdTimerRef.current = null;
      startRecording();
    }, HOLD_TO_RECORD_MS);
  };
  const onShutterUp = () => {
    if (holdTimerRef.current !== null) {
      window.clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
      takePhoto();
    } else if (recording) {
      stopRecording();
    }
  };

  const RING = 2 * Math.PI * 36;
  const progress = Math.min(1, elapsed / MAX_RECORD_SEC);

  return (
    <div className="relative flex-1 min-h-0 w-full bg-black overflow-hidden">
      <div className="absolute inset-0 mx-auto max-w-[calc(100dvh*9/16)]">
        <video
          ref={videoRef}
          className={`absolute inset-0 w-full h-full object-cover ${state === "ready" ? "" : "opacity-0"}`}
          style={{ transform: mirrored ? "scaleX(-1)" : undefined }}
          playsInline
          muted
          autoPlay
        />

        {state === "starting" && (
          <div className="absolute inset-0 grid place-items-center">
            <Loader2 className="w-8 h-8 animate-spin text-white/70" />
          </div>
        )}

        {state === "unavailable" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-8 text-center">
            <CameraOff className="w-12 h-12 text-white/60" />
            <p className="font-semibold">{t("stories.cameraNotAvailable")}</p>
            <button
              onClick={onPickGallery}
              className="flex items-center gap-2 rounded-full bg-white text-black font-semibold px-5 py-2.5"
            >
              <ImageIcon className="w-5 h-5" />
              {t("stories.pickFromGallery")}
            </button>
          </div>
        )}

        {/* top bar */}
        <div className="absolute top-0 inset-x-0 flex items-center justify-between p-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <button onClick={onClose} aria-label={t("actions.close")} className="p-2 rounded-full bg-black/30">
            <X className="w-6 h-6" />
          </button>
          <button
            onClick={onTextMode}
            className="flex items-center gap-1.5 rounded-full bg-black/30 px-3 py-2 text-sm font-semibold"
          >
            <Type className="w-4 h-4" />
            {t("stories.text")}
          </button>
        </div>

        {/* bottom controls */}
        <div className="absolute bottom-0 inset-x-0 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-6 bg-gradient-to-t from-black/50 to-transparent">
          {state === "ready" && !recording && (
            <p className="text-center text-xs text-white/80 mb-4">{t("stories.cameraHint")}</p>
          )}
          <div className="grid grid-cols-3 items-center px-6">
            <button
              onClick={onPickGallery}
              aria-label={t("stories.gallery")}
              className="justify-self-start p-3 rounded-xl bg-white/15 backdrop-blur"
            >
              <ImageIcon className="w-6 h-6" />
            </button>

            <button
              onPointerDown={onShutterDown}
              onPointerUp={onShutterUp}
              onPointerLeave={() => recording && stopRecording()}
              onContextMenu={(e) => e.preventDefault()}
              disabled={state !== "ready" || uploading}
              aria-label={t("stories.takePhoto")}
              className="justify-self-center relative w-20 h-20 grid place-items-center touch-none select-none disabled:opacity-40"
            >
              <svg className="absolute inset-0 -rotate-90" viewBox="0 0 80 80" aria-hidden="true">
                <circle cx="40" cy="40" r="36" fill="none" stroke="white" strokeWidth="5" opacity={recording ? 0.3 : 1} />
                {recording && (
                  <circle
                    cx="40"
                    cy="40"
                    r="36"
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="5"
                    strokeDasharray={RING}
                    strokeDashoffset={RING * (1 - progress)}
                    strokeLinecap="round"
                  />
                )}
              </svg>
              <span
                className={`block rounded-full bg-white transition-all ${recording ? "w-8 h-8 bg-red-500 rounded-lg" : "w-16 h-16"}`}
              />
            </button>

            {canFlip ? (
              <button
                onClick={() => setFacing((f) => (f === "user" ? "environment" : "user"))}
                disabled={recording}
                aria-label={t("stories.flipCamera")}
                className="justify-self-end p-3 rounded-full bg-white/15 backdrop-blur disabled:opacity-40"
              >
                <RefreshCw className="w-6 h-6" />
              </button>
            ) : (
              <span />
            )}
          </div>
        </div>

        {uploading && (
          <div className="absolute inset-0 grid place-items-center bg-black/50">
            <Loader2 className="w-10 h-10 animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
}
