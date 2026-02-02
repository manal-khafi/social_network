import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../hooks';
import { getSocket } from './socket';
import { connectInboxRealtime } from '../features/messages/messagesSlice';
import {
  addRealtimeNotification,
  applySocketRead,
  applySocketReadAll,
  fetchUnreadNotificationsCount,
  setUnreadCount,
  upsertServerNotification,
} from '../features/notifications/notificationsSlice';
import { toast } from 'sonner';
import { PATHS } from '../routes/paths';

type CallUIState =
  | null
  | {
      callId: string;
      otherUserId: string;
      callType: 'audio' | 'video';
      direction: 'incoming' | 'outgoing';
      status: 'ringing' | 'connecting' | 'in_call';
    };

export default function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const token = useAppSelector((s) => s.auth.token);
  const navigate = useNavigate();
  const location = useLocation();

  const tabIdRef = useRef<string>(
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? (crypto as any).randomUUID()
      : `${Date.now()}_${Math.random().toString(16).slice(2)}`
  );

  const [call, setCall] = useState<CallUIState>(null);
  const callRef = useRef<CallUIState>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  const rtcConfig = useMemo(
    () => ({ iceServers: [{ urls: ['stun:stun.l.google.com:19302'] }] }),
    []
  );

  const tryAcquireLocalLock = (key: string, ttlMs: number) => {
    try {
      const now = Date.now();
      const raw = localStorage.getItem(key);
      const existing = raw ? (JSON.parse(raw) as { ts: number; tabId: string }) : null;
      if (existing && now - existing.ts < ttlMs && existing.tabId !== tabIdRef.current) return false;
      localStorage.setItem(key, JSON.stringify({ ts: now, tabId: tabIdRef.current }));
      const confirm = localStorage.getItem(key);
      const parsed = confirm ? (JSON.parse(confirm) as { ts: number; tabId: string }) : null;
      return parsed?.tabId === tabIdRef.current;
    } catch {
      return true;
    }
  };

  const playNotificationSound = async () => {
    // Designed to be easy to disable later.
    const SOUND_ENABLED = true;
    if (!SOUND_ENABLED) return;

    // Reduce double-sound across tabs.
    if (document.visibilityState !== 'visible') return;
    if (!tryAcquireLocalLock('sn:notifSoundLock', 800)) return;

    try {
      const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') {
        try {
          await ctx.resume();
        } catch {
          // ignore
        }
      }

      // Soft, short chime ("iOS-like") built from WebAudio (no external assets).
      const now = ctx.currentTime;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.09, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2600, now);
      filter.Q.setValueAtTime(0.6, now);

      filter.connect(gain);
      gain.connect(ctx.destination);

      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      // Two quick notes to mimic a subtle notification chime.
      osc.frequency.setValueAtTime(784, now); // G5
      osc.frequency.setValueAtTime(988, now + 0.11); // B5
      osc.connect(filter);

      const harmonic = ctx.createOscillator();
      harmonic.type = 'sine';
      harmonic.frequency.setValueAtTime(1568, now); // 2nd harmonic
      harmonic.frequency.setValueAtTime(1976, now + 0.11);
      const hGain = ctx.createGain();
      hGain.gain.setValueAtTime(0.02, now);
      harmonic.connect(hGain);
      hGain.connect(filter);

      osc.start(now);
      harmonic.start(now);
      osc.stop(now + 0.36);
      harmonic.stop(now + 0.36);

      harmonic.onended = () => {
        try {
          ctx.close();
        } catch {
          // ignore
        }
      };
    } catch {
      // autoplay policies can block audio; ignore gracefully
    }
  };

  const showNotificationToast = (title: string, description: string) => {
    if (document.visibilityState !== 'visible') return;
    if (!tryAcquireLocalLock('sn:notifToastLock', 800)) return;

    toast(title, {
      description,
      duration: 4500,
      action: {
        label: 'View',
        onClick: () => {
          if (!location.pathname.startsWith(PATHS.NOTIFICATIONS)) navigate(PATHS.NOTIFICATIONS);
        },
      },
    });
  };

  useEffect(() => {
    callRef.current = call;
  }, [call]);

  const cleanupCall = () => {
    try {
      pcRef.current?.close();
    } catch {
      // ignore
    }
    pcRef.current = null;

    for (const t of localStreamRef.current?.getTracks() ?? []) t.stop();
    localStreamRef.current = null;
    remoteStreamRef.current = null;
    setLocalStream(null);
    setRemoteStream(null);
    setCall(null);
  };

  const ensurePeerConnection = (socket: any, otherUserId: string, callId: string) => {
    if (pcRef.current) return pcRef.current;

    const pc = new RTCPeerConnection(rtcConfig);
    pcRef.current = pc;

    const remote = new MediaStream();
    remoteStreamRef.current = remote;
    setRemoteStream(remote);

    pc.ontrack = (ev) => {
      for (const track of ev.streams[0]?.getTracks?.() ?? []) {
        remote.addTrack(track);
      }
    };

    pc.onicecandidate = (ev) => {
      if (!ev.candidate) return;
      socket.emit('call:ice-candidate', {
        callId,
        toUserId: otherUserId,
        candidate: ev.candidate,
      });
    };

    return pc;
  };

  const ensureLocalMedia = async (callType: 'audio' | 'video') => {
    if (localStreamRef.current) return localStreamRef.current;

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: callType === 'video',
    });
    localStreamRef.current = stream;
    setLocalStream(stream);
    return stream;
  };

  useEffect(() => {
    if (!token) return;

    const socket = getSocket(token);
    if (!socket) return;

    dispatch(connectInboxRealtime());
    dispatch(fetchUnreadNotificationsCount());

    const anySocket = socket as any;
    if (anySocket.__notifHandlersRegistered) return;
    anySocket.__notifHandlersRegistered = true;

    socket.on('notification:new', (payload: any) => {
      const serverNotif = payload?.notification;
      const unreadCount = payload?.unreadCount;

      if (serverNotif?.id) {
        dispatch(upsertServerNotification({ notification: serverNotif, unreadCount }));

        const title = String(serverNotif.title ?? 'Notification');
        const msg = String(serverNotif.message ?? 'New notification');
        showNotificationToast(title, msg);
        void playNotificationSound();
        return;
      }

      // Backward-compatible fallback (older server payloads)
      dispatch(
        addRealtimeNotification({
          kind: payload?.kind ?? 'system',
          title: payload?.kind ?? 'Notification',
          message: payload?.kind ? `New ${payload.kind}` : 'New notification',
          metadata: payload ?? null,
        })
      );

      showNotificationToast('Notification', payload?.kind ? `New ${payload.kind}` : 'New notification');
      void playNotificationSound();
    });

    socket.on('notification:unreadCount', (payload: any) => {
      if (typeof payload?.unreadCount === 'number') dispatch(setUnreadCount(payload.unreadCount));
    });

    socket.on('notification:read', (payload: any) => {
      const notificationId = String(payload?.notificationId ?? '');
      if (!notificationId) return;
      dispatch(applySocketRead({ notificationId, unreadCount: payload?.unreadCount }));
      if (payload?.notification?.id) {
        dispatch(upsertServerNotification({ notification: payload.notification, unreadCount: payload?.unreadCount }));
      }
    });

    socket.on('notification:readAll', (payload: any) => {
      dispatch(applySocketReadAll({ unreadCount: payload?.unreadCount }));
    });

    socket.on('connect_error', (err: any) => {
      const msg = err?.message ? String(err.message) : 'SOCKET_CONNECT_ERROR';
      toast.error(`Realtime connection failed: ${msg}`);
    });

    // ---- Calls (WebRTC signalling) ----
    socket.on('call:error', (payload: any) => {
      const msg = payload?.message ? String(payload.message) : 'CALL_ERROR';
      toast.error(`Call failed: ${msg}`);
      cleanupCall();
    });

    socket.on('call:ringing', (payload: { callId: string; calleeId: string; callType: 'audio' | 'video' }) => {
      setCall({
        callId: payload.callId,
        otherUserId: payload.calleeId,
        callType: payload.callType,
        direction: 'outgoing',
        status: 'ringing',
      });
    });

    socket.on(
      'call:incoming',
      (payload: { callId: string; fromUserId: string; callType: 'audio' | 'video'; conversationId?: string | null }) => {
        setCall({
          callId: payload.callId,
          otherUserId: payload.fromUserId,
          callType: payload.callType,
          direction: 'incoming',
          status: 'ringing',
        });
      }
    );

    socket.on('call:accepted', async (payload: { callId: string; byUserId: string }) => {
      setCall((prev) => {
        if (!prev || prev.callId !== payload.callId) return prev;
        return { ...prev, status: 'connecting' };
      });

      const current = callRef.current;
      const otherUserId = (current && current.otherUserId) || payload.byUserId;
      const callId = payload.callId;

      try {
        const pc = ensurePeerConnection(socket, otherUserId, callId);
        const stream = await ensureLocalMedia((current && current.callType) || 'audio');
        for (const track of stream.getTracks()) pc.addTrack(track, stream);

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('call:offer', {
          callId,
          toUserId: otherUserId,
          sdp: offer,
        });
      } catch {
        cleanupCall();
      }
    });

    socket.on('call:rejected', (payload: { callId: string; byUserId: string }) => {
      if (callRef.current && callRef.current.callId === payload.callId) cleanupCall();
    });

    socket.on('call:ended', (payload: { callId: string; byUserId: string }) => {
      if (callRef.current && callRef.current.callId === payload.callId) cleanupCall();
    });

    const handleSignal = async (args: { callId: string; otherUserId: string; type: 'offer' | 'answer' | 'ice'; sdp?: any; candidate?: any }) => {
      const callId = args.callId;
      const otherUserId = args.otherUserId;
      const type = args.type;

      setCall((prev) => {
        if (!prev) {
          // allow auto-call state creation if we receive signalling while UI isn't set yet
          return {
            callId,
            otherUserId,
            callType: 'audio',
            direction: 'incoming',
            status: 'connecting',
          };
        }
        if (prev.callId !== callId) return prev;
        return prev.status === 'in_call' ? prev : { ...prev, status: 'connecting' };
      });

      try {
        const pc = ensurePeerConnection(socket, otherUserId, callId);

        if (type === 'offer' && args.sdp) {
          const current = callRef.current;
          const stream = await ensureLocalMedia((current && current.callType) || 'audio');
          for (const track of stream.getTracks()) pc.addTrack(track, stream);

          await pc.setRemoteDescription(new RTCSessionDescription(args.sdp));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit('call:answer', {
            callId,
            toUserId: otherUserId,
            sdp: answer,
          });
          setCall((prev) => (prev && prev.callId === callId ? { ...prev, status: 'in_call' } : prev));
        }

        if (type === 'answer' && args.sdp) {
          await pc.setRemoteDescription(new RTCSessionDescription(args.sdp));
          setCall((prev) => (prev && prev.callId === callId ? { ...prev, status: 'in_call' } : prev));
        }

        if (type === 'ice' && args.candidate) {
          await pc.addIceCandidate(new RTCIceCandidate(args.candidate));
        }
      } catch {
        // ignore
      }

    };

    socket.on('call:offer', async (payload: { callId: string; fromUserId: string; sdp: any }) => {
      await handleSignal({ callId: payload.callId, otherUserId: payload.fromUserId, type: 'offer', sdp: payload.sdp });
    });

    socket.on('call:answer', async (payload: { callId: string; fromUserId: string; sdp: any }) => {
      await handleSignal({ callId: payload.callId, otherUserId: payload.fromUserId, type: 'answer', sdp: payload.sdp });
    });

    socket.on('call:ice-candidate', async (payload: { callId: string; fromUserId: string; candidate: any }) => {
      await handleSignal({ callId: payload.callId, otherUserId: payload.fromUserId, type: 'ice', candidate: payload.candidate });
    });

    // Backward-compatible handler (older clients)
    socket.on('call:signal', async (payload: { callId: string; fromUserId: string; data: any }) => {
      const data = payload.data;
      if (data?.type === 'offer') {
        await handleSignal({ callId: payload.callId, otherUserId: payload.fromUserId, type: 'offer', sdp: data?.sdp });
      }
      if (data?.type === 'answer') {
        await handleSignal({ callId: payload.callId, otherUserId: payload.fromUserId, type: 'answer', sdp: data?.sdp });
      }
      if (data?.type === 'ice') {
        await handleSignal({ callId: payload.callId, otherUserId: payload.fromUserId, type: 'ice', candidate: data?.candidate });
      }
    });

    return () => {
      // keep socket connected globally; handlers are idempotent
    };
  }, [dispatch, token]);

  return (
    <>
      {children}

      {call && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl bg-background p-4 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">
                  {call.direction === 'incoming' ? 'Incoming call' : 'Calling'}
                </div>
                <div className="text-lg font-semibold">{call.callType.toUpperCase()} · {call.status}</div>
                <div className="text-xs text-muted-foreground">User: {call.otherUserId}</div>
              </div>
              <button
                className="rounded-md px-3 py-1 text-sm hover:bg-muted"
                onClick={() => {
                  const socket = getSocket(token);
                  if (socket && call) {
                    socket.emit('call:end', { callId: call.callId, otherUserId: call.otherUserId });
                  }
                  cleanupCall();
                }}
              >
                Close
              </button>
            </div>

            {call.callType === 'video' && (
              <div className="mt-3 grid grid-cols-2 gap-2">
                <video
                  className="w-full rounded-lg bg-black"
                  autoPlay
                  muted
                  playsInline
                  ref={(el) => {
                    if (el && localStream) el.srcObject = localStream;
                  }}
                />
                <video
                  className="w-full rounded-lg bg-black"
                  autoPlay
                  playsInline
                  ref={(el) => {
                    if (el && remoteStream) el.srcObject = remoteStream;
                  }}
                />
              </div>
            )}

            {call.callType === 'audio' && (
              <div className="mt-3">
                {/* local stream kept muted to avoid echo */}
                <audio
                  autoPlay
                  muted
                  playsInline
                  ref={(el) => {
                    if (el && localStream) (el as any).srcObject = localStream;
                  }}
                />
                <audio
                  autoPlay
                  playsInline
                  ref={(el) => {
                    if (el && remoteStream) (el as any).srcObject = remoteStream;
                  }}
                />
                <div className="mt-2 text-xs text-muted-foreground">Audio connected (use device volume)</div>
              </div>
            )}

            <div className="mt-4 flex gap-2">
              {call.direction === 'incoming' && call.status === 'ringing' && (
                <>
                  <button
                    className="flex-1 rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700"
                    onClick={async () => {
                      const socket = getSocket(token);
                      if (!socket) return;
                      setCall((prev) => (prev ? { ...prev, status: 'connecting' } : prev));
                      socket.emit('call:accept', { callId: call.callId, otherUserId: call.otherUserId });
                      try {
                        await ensureLocalMedia(call.callType);
                        ensurePeerConnection(socket, call.otherUserId, call.callId);
                      } catch {
                        cleanupCall();
                      }
                    }}
                  >
                    Accept
                  </button>
                  <button
                    className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"
                    onClick={() => {
                      const socket = getSocket(token);
                      socket?.emit('call:reject', { callId: call.callId, otherUserId: call.otherUserId });
                      cleanupCall();
                    }}
                  >
                    Reject
                  </button>
                </>
              )}

              {call.direction === 'outgoing' && call.status === 'ringing' && (
                <button
                  className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"
                  onClick={() => {
                    const socket = getSocket(token);
                    socket?.emit('call:end', { callId: call.callId, otherUserId: call.otherUserId });
                    cleanupCall();
                  }}
                >
                  Cancel
                </button>
              )}

              {call.status !== 'ringing' && (
                <button
                  className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"
                  onClick={() => {
                    const socket = getSocket(token);
                    socket?.emit('call:end', { callId: call.callId, otherUserId: call.otherUserId });
                    cleanupCall();
                  }}
                >
                  Hang up
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
