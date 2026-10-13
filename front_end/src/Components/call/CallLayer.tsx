import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff } from "lucide-react";
import { useCall } from "../../features/call/CallProvider";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { useTranslation } from "react-i18next";

function useRingtone(active: boolean) {
  const ctxRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<number | null>(null);
  useEffect(() => {
    if (!active) return;
    const AC = window.AudioContext || (window as any).webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    ctxRef.current = ctx;
    const beep = () => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.value = 480;
      g.gain.setValueAtTime(0.0001, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + 0.05);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6);
      o.connect(g).connect(ctx.destination);
      o.start();
      o.stop(ctx.currentTime + 0.65);
    };
    beep();
    timerRef.current = window.setInterval(beep, 1600);
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      ctx.close().catch(() => {});
    };
  }, [active]);
}

function fmt(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function CallLayer() {
  const { t } = useTranslation();
  const call = useCall();
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const [elapsed, setElapsed] = useState(0);

  useRingtone(call.status === "incoming");

  useEffect(() => {
    if (localVideoRef.current) localVideoRef.current.srcObject = call.localStream;
  }, [call.localStream, call.status]);

  useEffect(() => {
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = call.remoteStream;
    if (remoteAudioRef.current) remoteAudioRef.current.srcObject = call.remoteStream;
  }, [call.remoteStream, call.status]);

  useEffect(() => {
    if (call.status !== "active" || !call.startedAt) {
      setElapsed(0);
      return;
    }
    const t = window.setInterval(
      () => setElapsed(Math.floor((Date.now() - call.startedAt!) / 1000)),
      1000
    );
    return () => window.clearInterval(t);
  }, [call.status, call.startedAt]);

  if (call.status === "idle") return null;

  const initial = call.peer?.username?.[0]?.toUpperCase() ?? "?";
  const isVideo = call.callType === "video";

  // Incoming: compact ringing card
  if (call.status === "incoming") {
    return createPortal(
      <div className="fixed inset-x-0 top-4 z-[120] flex justify-center px-4">
        <div className="w-full max-w-sm rounded-2xl bg-neutral-900 text-white shadow-2xl border border-white/10 p-4">
          <div className="flex items-center gap-3">
            <Avatar className="w-12 h-12">
              <AvatarImage src={call.peer?.avatar ?? undefined} />
              <AvatarFallback>{initial}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="font-semibold truncate">{call.peer?.username}</p>
              <p className="text-xs text-white/60">
                Incoming {isVideo ? "video" : "voice"} call…
              </p>
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <button
              onClick={call.reject}
              className="flex-1 flex items-center justify-center gap-2 rounded-full bg-red-600 py-2.5 font-semibold"
            >
              <PhoneOff className="w-4 h-4" /> Decline
            </button>
            <button
              onClick={call.accept}
              className="flex-1 flex items-center justify-center gap-2 rounded-full bg-green-600 py-2.5 font-semibold"
            >
              <Phone className="w-4 h-4" /> Accept
            </button>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  // Outgoing / connecting / active: full-screen call
  const label =
    call.status === "outgoing"
      ? t("calls.calling")
      : call.status === "connecting"
      ? t("calls.connecting")
      : fmt(elapsed);

  return createPortal(
    <div className="fixed inset-0 z-[120] bg-neutral-950 text-white flex flex-col">
      <audio ref={remoteAudioRef} autoPlay />

      <div className="relative flex-1 overflow-hidden">
        {isVideo && call.status === "active" ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="absolute inset-0 w-full h-full object-cover bg-black"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
            <Avatar className="w-28 h-28">
              <AvatarImage src={call.peer?.avatar ?? undefined} />
              <AvatarFallback className="text-3xl">{initial}</AvatarFallback>
            </Avatar>
            <p className="text-xl font-semibold">{call.peer?.username}</p>
          </div>
        )}

        <div className="absolute top-5 start-0 end-0 text-center">
          <p className="text-sm text-white/80">
            {isVideo ? t("messages.videoCall") : t("messages.voiceCall")} · {label}
          </p>
        </div>

        {isVideo && call.localStream && (
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="absolute bottom-28 end-4 w-28 h-40 object-cover rounded-xl border border-white/20 bg-black"
          />
        )}
      </div>

      <div className="pb-10 pt-4 flex items-center justify-center gap-5">
        <button
          onClick={call.toggleMute}
          className={`w-14 h-14 rounded-full grid place-items-center ${
            call.muted ? "bg-white text-black" : "bg-white/15"
          }`}
          aria-label={call.muted ? t("stories.unmute") : t("stories.mute")}
        >
          {call.muted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
        </button>

        {isVideo && (
          <button
            onClick={call.toggleCamera}
            className={`w-14 h-14 rounded-full grid place-items-center ${
              call.cameraOff ? "bg-white text-black" : "bg-white/15"
            }`}
            aria-label={call.cameraOff ? t("calls.turnCameraOn") : t("calls.turnCameraOff")}
          >
            {call.cameraOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
          </button>
        )}

        <button
          onClick={call.hangup}
          className="w-16 h-16 rounded-full bg-red-600 grid place-items-center"
          aria-label={t("calls.hangUp")}
        >
          <PhoneOff className="w-7 h-7" />
        </button>
      </div>
    </div>,
    document.body
  );
}
