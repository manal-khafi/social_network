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

export function CallProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<CallStatus>("idle");
  const [peer, setPeer] = useState<CallPeer | null>(null);
  const [callType, setCallType] = useState<CallType>("audio");
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [startedAt, setStartedAt] = useState<number | null>(null);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localRef = useRef<MediaStream | null>(null);
  const remoteRef = useRef<MediaStream | null>(null);
  const callIdRef = useRef<string | null>(null);
  const isCallerRef = useRef(false);
  const pendingOfferRef = useRef<RTCSessionDescriptionInit | null>(null);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);

  const cleanup = useCallback(() => {
    pcRef.current?.getSenders().forEach((s) => s.track?.stop());
    pcRef.current?.close();
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
  }, []);

  const getMedia = useCallback(async (video: boolean) => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: video ? { facingMode: "user" } : false,
    });
    localRef.current = stream;
    setLocalStream(stream);
    return stream;
  }, []);

  const buildPc = useCallback(async () => {
    const pc = new RTCPeerConnection(await iceConfig());
    pcRef.current = pc;

    pc.onicecandidate = (e) => {
      if (e.candidate && callIdRef.current) {
        getSocket().emit("call:ice", {
          callId: callIdRef.current,
          candidate: e.candidate.toJSON(),
        });
      }
    };
    pc.ontrack = (e) => {
      const rs = remoteRef.current ?? new MediaStream();
      remoteRef.current = rs;
      e.streams[0]?.getTracks().forEach((t) => {
        if (!rs.getTracks().some((x) => x.id === t.id)) rs.addTrack(t);
      });
      setRemoteStream(rs);
    };
    pc.onconnectionstatechange = () => {
      const st = pc.connectionState;
      if (st === "connected") {
        setStatus("active");
        setStartedAt((prev) => prev ?? Date.now());
      } else if (st === "failed" || st === "closed" || st === "disconnected") {
        if (callIdRef.current) {
          getSocket().emit("call:end", { callId: callIdRef.current });
        }
        cleanup();
      }
    };
    return pc;
  }, [cleanup]);

  const flushCandidates = useCallback(async () => {
    const pc = pcRef.current;
    if (!pc || !pc.remoteDescription) return;
    for (const c of pendingCandidatesRef.current) {
      await pc.addIceCandidate(c).catch(() => {});
    }
    pendingCandidatesRef.current = [];
  }, []);

  const startCall = useCallback(
    async (target: CallPeer, type: CallType) => {
      if (status !== "idle") return;
      const callId = genId();
      callIdRef.current = callId;
      isCallerRef.current = true;
      setPeer(target);
      setCallType(type);
      setStatus("outgoing");
      try {
        const stream = await getMedia(type === "video");
        const pc = await buildPc();
        stream.getTracks().forEach((t) => pc.addTrack(t, stream));
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        getSocket().emit("call:invite", {
          callId,
          toUserId: target.id,
          callType: type,
          sdp: offer,
        });
      } catch {
        toast.error("Couldn't access your microphone/camera");
        if (callIdRef.current) getSocket().emit("call:cancel", { callId: callIdRef.current });
        cleanup();
      }
    },
    [status, getMedia, buildPc, cleanup]
  );

  const accept = useCallback(async () => {
    if (status !== "incoming" || !pendingOfferRef.current) return;
    setStatus("connecting");
    try {
      const stream = await getMedia(callType === "video");
      const pc = await buildPc();
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));
      await pc.setRemoteDescription(pendingOfferRef.current);
      await flushCandidates();
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      getSocket().emit("call:accept", { callId: callIdRef.current, sdp: answer });
    } catch {
      toast.error("Couldn't access your microphone/camera");
      getSocket().emit("call:reject", { callId: callIdRef.current });
      cleanup();
    }
  }, [status, callType, getMedia, buildPc, flushCandidates, cleanup]);

  const reject = useCallback(() => {
    if (callIdRef.current) getSocket().emit("call:reject", { callId: callIdRef.current });
    cleanup();
  }, [cleanup]);

  const hangup = useCallback(() => {
    const id = callIdRef.current;
    if (id) {
      const ev = status === "outgoing" && isCallerRef.current ? "call:cancel" : "call:end";
      getSocket().emit(ev, { callId: id });
    }
    cleanup();
  }, [status, cleanup]);

  const toggleMute = useCallback(() => {
    const tracks = localRef.current?.getAudioTracks() ?? [];
    const next = !(tracks[0]?.enabled ?? true);
    tracks.forEach((t) => (t.enabled = next));
    setMuted(!next);
  }, []);

  const toggleCamera = useCallback(() => {
    const tracks = localRef.current?.getVideoTracks() ?? [];
    const next = !(tracks[0]?.enabled ?? true);
    tracks.forEach((t) => (t.enabled = next));
    setCameraOff(!next);
  }, []);

  // Signaling listeners
  useEffect(() => {
    const socket = getSocket();

    const onIncoming = (p: any) => {
      if (status !== "idle" || pcRef.current) {
        socket.emit("call:reject", { callId: p.callId });
        return;
      }
      callIdRef.current = p.callId;
      isCallerRef.current = false;
      pendingOfferRef.current = p.sdp;
      setPeer({
        id: p.from?.id,
        username: p.from?.username ?? "Unknown",
        avatar: p.from?.avatar_url ?? null,
      });
      setCallType(p.callType === "video" ? "video" : "audio");
      setStatus("incoming");
    };

    const onAccepted = async (p: any) => {
      if (p.callId !== callIdRef.current || !pcRef.current) return;
      await pcRef.current.setRemoteDescription(p.sdp).catch(() => {});
      await flushCandidates();
      setStatus("connecting");
    };

    const onIce = async (p: any) => {
      if (p.callId !== callIdRef.current || !p.candidate) return;
      const pc = pcRef.current;
      if (pc?.remoteDescription) await pc.addIceCandidate(p.candidate).catch(() => {});
      else pendingCandidatesRef.current.push(p.candidate);
    };

    const onRejected = () => {
      toast("Call declined");
      cleanup();
    };
    const onCanceled = () => {
      toast("Call canceled");
      cleanup();
    };
    const onEnded = () => cleanup();
    const onBusy = () => {
      toast("They're on another call");
      cleanup();
    };
    const onUnavailable = () => {
      toast("They're offline right now");
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

    return () => {
      socket.off("call:incoming", onIncoming);
      socket.off("call:accepted", onAccepted);
      socket.off("call:ice", onIce);
      socket.off("call:rejected", onRejected);
      socket.off("call:canceled", onCanceled);
      socket.off("call:ended", onEnded);
      socket.off("call:busy", onBusy);
      socket.off("call:unavailable", onUnavailable);
    };
  }, [status, flushCandidates, cleanup]);

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
