import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import { getSocket } from "../../realtime/socket";
import { getIceServers } from "../../api/messagesApi";
import i18n from "../../i18n/i18n";

export type CallStatus = "idle" | "outgoing" | "incoming" | "connecting" | "active";
export type CallType = "audio" | "video";

export interface CallPeer {
  id: string;
  username: string;
  avatar?: string | null;
}

interface CallApi {
  status: CallStatus;
  peer: CallPeer | null;
  callType: CallType;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  muted: boolean;
  cameraOff: boolean;
  startedAt: number | null;
  startCall: (peer: CallPeer, type: CallType) => void;
  accept: () => void;
  reject: () => void;
  hangup: () => void;
  toggleMute: () => void;
  toggleCamera: () => void;
}

const CallContext = createContext<CallApi | null>(null);
export const useCall = () => {
  const v = useContext(CallContext);
  if (!v) throw new Error("useCall must be used within <CallProvider>");
  return v;
};

const genId = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

// How long a "disconnected" peer connection may try to recover on its own
// (network switch, brief packet loss) before the call is dropped.
const DISCONNECT_GRACE_MS = 10_000;

let iceCache: RTCConfiguration | null = null;
async function iceConfig(): Promise<RTCConfiguration> {
  if (iceCache) return iceCache;
  try {
    const { iceServers } = await getIceServers();
    iceCache = { iceServers };
  } catch {
    iceCache = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };
  }
  return iceCache;
}

/** Translated reason for a getUserMedia failure. */
function mediaErrorMessage(err: unknown) {
  if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
    return i18n.t("calls.insecureContext");
  }
  const name = (err as { name?: string })?.name;
  if (name === "NotAllowedError" || name === "SecurityError") return i18n.t("calls.permissionDenied");
  if (name === "NotFoundError" || name === "OverconstrainedError") return i18n.t("calls.noDevice");
  return i18n.t("calls.couldntAccessYourMicrophoneCamera");
}

/**
 * Best-effort local media: camera + mic for a video call, falling back to mic
 * only (camera denied, missing or busy in another app). Returns null when no
 * media at all could be opened, with the error that caused it.
 */
async function openMedia(video: boolean): Promise<{ stream: MediaStream | null; error?: unknown; videoFailed?: boolean }> {
  if (!navigator.mediaDevices?.getUserMedia) return { stream: null, error: new Error("insecure") };
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: video ? { facingMode: "user" } : false,
    });
    return { stream };
  } catch (err) {
    if (!video) return { stream: null, error: err };
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      return { stream, videoFailed: true };
    } catch {
      return { stream: null, error: err };
    }
  }
}

export function CallProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatusState] = useState<CallStatus>("idle");
  const [peer, setPeer] = useState<CallPeer | null>(null);
  const [callType, setCallType] = useState<CallType>("audio");
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [startedAt, setStartedAt] = useState<number | null>(null);

  // Socket handlers are registered once, so they read the live status from a
  // ref instead of a stale render closure.
  const statusRef = useRef<CallStatus>("idle");
  const callTypeRef = useRef<CallType>("audio");
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localRef = useRef<MediaStream | null>(null);
  const remoteRef = useRef<MediaStream | null>(null);
  const callIdRef = useRef<string | null>(null);
  const isCallerRef = useRef(false);
  const pendingOfferRef = useRef<RTCSessionDescriptionInit | null>(null);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const disconnectTimerRef = useRef<number | null>(null);

  const setStatus = useCallback((s: CallStatus) => {
    statusRef.current = s;
    setStatusState(s);
  }, []);

  const cleanup = useCallback(() => {
    if (disconnectTimerRef.current) window.clearTimeout(disconnectTimerRef.current);
    disconnectTimerRef.current = null;
    const pc = pcRef.current;
    if (pc) {
      pc.onicecandidate = null;
      pc.ontrack = null;
      pc.onconnectionstatechange = null;
      pc.getSenders().forEach((s) => s.track?.stop());
      pc.close();
    }
    pcRef.current = null;
    localRef.current?.getTracks().forEach((t) => t.stop());
    localRef.current = null;
    remoteRef.current = null;
    callIdRef.current = null;
    isCallerRef.current = false;
    pendingOfferRef.current = null;
    pendingCandidatesRef.current = [];
    setStatus("idle");
    setPeer(null);
    setLocalStream(null);
    setRemoteStream(null);
    setMuted(false);
    setCameraOff(false);
    setStartedAt(null);
  }, [setStatus]);

  // End the current call from our side: tell the server, then reset.
  const endCall = useCallback(
    (reason?: string) => {
      const id = callIdRef.current;
      if (id) {
        const ev =
          statusRef.current === "outgoing" && isCallerRef.current ? "call:cancel" : "call:end";
        getSocket().emit(ev, { callId: id });
      }
      if (reason) toast.error(reason);
      cleanup();
    },
    [cleanup]
  );

  const buildPc = useCallback(async (callId: string) => {
    const pc = new RTCPeerConnection(await iceConfig());

    pc.onicecandidate = (e) => {
      if (e.candidate && callIdRef.current === callId) {
        getSocket().emit("call:ice", { callId, candidate: e.candidate.toJSON() });
      }
    };
    pc.ontrack = (e) => {
      const rs = remoteRef.current ?? new MediaStream();
      remoteRef.current = rs;
      if (!rs.getTracks().some((x) => x.id === e.track.id)) rs.addTrack(e.track);
      // New object so consumers re-attach and pick up the added track.
      setRemoteStream(new MediaStream(rs.getTracks()));
    };
    pc.onconnectionstatechange = () => {
      if (pcRef.current !== pc) return;
      const st = pc.connectionState;
      if (st === "connected") {
        if (disconnectTimerRef.current) window.clearTimeout(disconnectTimerRef.current);
        disconnectTimerRef.current = null;
        setStatus("active");
        setStartedAt((prev) => prev ?? Date.now());
      } else if (st === "disconnected") {
        if (disconnectTimerRef.current) return;
        disconnectTimerRef.current = window.setTimeout(() => {
          disconnectTimerRef.current = null;
          if (pcRef.current === pc && pc.connectionState !== "connected") {
            endCall(i18n.t("calls.connectionLost"));
          }
        }, DISCONNECT_GRACE_MS);
      } else if (st === "failed") {
        endCall(i18n.t("calls.connectionLost"));
      }
    };
    return pc;
  }, [setStatus, endCall]);

  const flushCandidates = useCallback(async () => {
    const pc = pcRef.current;
    if (!pc || !pc.remoteDescription) return;
    // Candidates pushed while we await are picked up by the same loop.
    const queue = pendingCandidatesRef.current;
    for (const c of queue) {
      await pc.addIceCandidate(c).catch(() => {});
    }
    if (pendingCandidatesRef.current === queue) pendingCandidatesRef.current = [];
  }, []);

  const startCall = useCallback(
    async (target: CallPeer, type: CallType) => {
      if (statusRef.current !== "idle") return;
      const callId = genId();
      callIdRef.current = callId;
      isCallerRef.current = true;
      callTypeRef.current = type;
      setPeer(target);
      setCallType(type);
      setStatus("outgoing");

      const media = await openMedia(type === "video");
      // Hung up while the permission prompt was open.
      if (callIdRef.current !== callId) {
        media.stream?.getTracks().forEach((t) => t.stop());
        return;
      }
      if (!media.stream) {
        toast.error(mediaErrorMessage(media.error));
        cleanup();
        return;
      }
      if (media.videoFailed) toast(i18n.t("calls.cameraUnavailableAudioOnly"));
      localRef.current = media.stream;
      setLocalStream(media.stream);

      try {
        const pc = await buildPc(callId);
        if (callIdRef.current !== callId) {
          pc.close();
          return;
        }
        pcRef.current = pc;
        const stream = media.stream;
        const audio = stream.getAudioTracks()[0];
        const video = stream.getVideoTracks()[0];
        pc.addTrack(audio, stream);
        // Still ask to receive the other side's camera when ours is unavailable.
        if (video) pc.addTrack(video, stream);
        else if (type === "video") pc.addTransceiver("video", { direction: "recvonly" });

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        if (callIdRef.current !== callId) return;
        getSocket().emit("call:invite", {
          callId,
          toUserId: target.id,
          callType: type,
          sdp: offer,
        });
      } catch {
        if (callIdRef.current !== callId) return;
        toast.error(i18n.t("calls.connectionLost"));
        cleanup();
      }
    },
    [buildPc, cleanup, setStatus]
  );

  const accept = useCallback(async () => {
    const callId = callIdRef.current;
    const offer = pendingOfferRef.current;
    if (statusRef.current !== "incoming" || !callId || !offer) return;
    setStatus("connecting");

    const media = await openMedia(callTypeRef.current === "video");
    // The caller hung up (or the call was answered in another tab) meanwhile.
    if (callIdRef.current !== callId) {
      media.stream?.getTracks().forEach((t) => t.stop());
      return;
    }
    if (!media.stream) {
      // Answer anyway so the call isn't lost; we just can't send audio/video.
      toast.error(`${mediaErrorMessage(media.error)} — ${i18n.t("calls.joinedListenOnly")}`);
    } else if (media.videoFailed) {
      toast(i18n.t("calls.cameraUnavailableAudioOnly"));
    }
    if (media.stream) {
      localRef.current = media.stream;
      setLocalStream(media.stream);
    }
    setCameraOff(!media.stream?.getVideoTracks().length && callTypeRef.current === "video");

    try {
      const pc = await buildPc(callId);
      if (callIdRef.current !== callId) {
        pc.close();
        return;
      }
      pcRef.current = pc;
      // Remote description first so our tracks reuse the offered transceivers.
      await pc.setRemoteDescription(offer);
      media.stream?.getTracks().forEach((t) => pc.addTrack(t, media.stream!));
      await flushCandidates();
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      if (callIdRef.current !== callId) return;
      getSocket().emit("call:accept", { callId, sdp: answer });
    } catch {
      if (callIdRef.current !== callId) return;
      getSocket().emit("call:reject", { callId });
      toast.error(i18n.t("calls.connectionLost"));
      cleanup();
    }
  }, [buildPc, flushCandidates, cleanup, setStatus]);

  const reject = useCallback(() => {
    if (callIdRef.current) getSocket().emit("call:reject", { callId: callIdRef.current });
    cleanup();
  }, [cleanup]);

  const hangup = useCallback(() => endCall(), [endCall]);

  const toggleMute = useCallback(() => {
    const tracks = localRef.current?.getAudioTracks() ?? [];
    if (!tracks.length) return;
    const next = !tracks[0].enabled;
    tracks.forEach((t) => (t.enabled = next));
    setMuted(!next);
  }, []);

  const toggleCamera = useCallback(() => {
    const tracks = localRef.current?.getVideoTracks() ?? [];
    if (!tracks.length) return;
    const next = !tracks[0].enabled;
    tracks.forEach((t) => (t.enabled = next));
    setCameraOff(!next);
  }, []);

  // Signaling listeners (registered once; read live state from refs).
  useEffect(() => {
    const socket = getSocket();
    const mine = (p: any) => !!p?.callId && p.callId === callIdRef.current;

    const onIncoming = (p: any) => {
      if (!p?.callId || !p?.sdp) return;
      if (statusRef.current !== "idle" || pcRef.current) {
        socket.emit("call:reject", { callId: p.callId });
        return;
      }
      callIdRef.current = p.callId;
      isCallerRef.current = false;
      pendingOfferRef.current = p.sdp;
      pendingCandidatesRef.current = [];
      const type: CallType = p.callType === "video" ? "video" : "audio";
      callTypeRef.current = type;
      setPeer({
        id: p.from?.id,
        username: p.from?.username ?? i18n.t("messages.unknownUser"),
        avatar: p.from?.avatar_url ?? null,
      });
      setCallType(type);
      setStatus("incoming");
    };

    const onAccepted = async (p: any) => {
      const pc = pcRef.current;
      if (!mine(p) || !pc || !p.sdp) return;
      if (statusRef.current === "outgoing") setStatus("connecting");
      try {
        await pc.setRemoteDescription(p.sdp);
        await flushCandidates();
      } catch {
        if (mine(p)) endCall(i18n.t("calls.connectionLost"));
      }
    };

    const onIce = async (p: any) => {
      if (!mine(p) || !p.candidate) return;
      const pc = pcRef.current;
      if (pc?.remoteDescription) await pc.addIceCandidate(p.candidate).catch(() => {});
      else pendingCandidatesRef.current.push(p.candidate);
    };

    const onRejected = (p: any) => {
      if (!mine(p)) return;
      toast(i18n.t("calls.callDeclined"));
      cleanup();
    };
    const onCanceled = (p: any) => {
      if (!mine(p)) return;
      if (!p.answeredElsewhere) toast(i18n.t("calls.callCanceled"));
      cleanup();
    };
    const onEnded = (p: any) => {
      if (mine(p)) cleanup();
    };
    const onBusy = (p: any) => {
      if (!mine(p)) return;
      toast(i18n.t("calls.theyreOnAnotherCall"));
      cleanup();
    };
    const onUnavailable = (p: any) => {
      if (!mine(p)) return;
      toast(i18n.t("calls.theyreOfflineRightNow"));
      cleanup();
    };
    const onNoAnswer = (p: any) => {
      if (!mine(p)) return;
      toast(i18n.t("calls.noAnswer"));
      cleanup();
    };
    // The server ends our calls when this socket drops, so mirror that locally.
    const onSocketDisconnect = () => {
      if (statusRef.current === "idle") return;
      toast.error(i18n.t("calls.connectionLost"));
      cleanup();
    };

    socket.on("call:incoming", onIncoming);
    socket.on("call:accepted", onAccepted);
    socket.on("call:ice", onIce);
    socket.on("call:rejected", onRejected);
    socket.on("call:canceled", onCanceled);
    socket.on("call:ended", onEnded);
    socket.on("call:busy", onBusy);
    socket.on("call:unavailable", onUnavailable);
    socket.on("call:no-answer", onNoAnswer);
    socket.on("disconnect", onSocketDisconnect);

    return () => {
      socket.off("call:incoming", onIncoming);
      socket.off("call:accepted", onAccepted);
      socket.off("call:ice", onIce);
      socket.off("call:rejected", onRejected);
      socket.off("call:canceled", onCanceled);
      socket.off("call:ended", onEnded);
      socket.off("call:busy", onBusy);
      socket.off("call:unavailable", onUnavailable);
      socket.off("call:no-answer", onNoAnswer);
      socket.off("disconnect", onSocketDisconnect);
    };
  }, [flushCandidates, cleanup, endCall, setStatus]);

  // Leaving the signed-in shell (logout) ends any call in progress.
  useEffect(() => () => endCall(), [endCall]);

  return (
    <CallContext.Provider
      value={{
        status,
        peer,
        callType,
        localStream,
        remoteStream,
        muted,
        cameraOff,
        startedAt,
        startCall,
        accept,
        reject,
        hangup,
        toggleMute,
        toggleCamera,
      }}
    >
      {children}
    </CallContext.Provider>
  );
}
