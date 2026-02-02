import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../hooks';
import {
  archiveConversation,
  connectInboxRealtime,
  createOrGetDirectConversation,
  deleteConversation,
  fetchConversations,
  fetchMessagesPage,
  leaveConversation,
  sendMessageRealtime,
  setCurrentConversation,
  setTyping,
  subscribePresence,
} from '../../features/messages/messagesSlice';
import { blockUser } from '../../features/user/userSlice';
import type { Message} from '../../features/messages/messagesSlice';
import { 
  ArrowLeft, Send, Smile, Image as ImageIcon, Mic, Paperclip, 
  Phone, Video, MoreVertical, CheckCheck, Check, MapPin, 
  Calendar, BarChart3, Play, Archive, Ban, Trash2, UserCircle
} from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '../../Components/ui/avatar';
import { Input } from '../../Components/ui/input';
import { Button } from '../../Components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../Components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '../../Components/ui/popover';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '../../Components/ui/dropdown-menu';
import { toast } from 'sonner';
import EmojiPicker from 'emoji-picker-react';
import { getSocket } from '../../realtime/socket';
import api from '../../api/axios';
import { uploadInboxAudio, uploadInboxFile, uploadInboxImage } from '../../services/inboxStorageService';

const STICKERS = [
  '👍', '❤️', '😂', '😮', '😢', '🙏', '👏', '🔥', '🎉', '💯'
];

const EMPTY_MESSAGES: Message[] = [];
const EMPTY_TYPING: Record<string, boolean> = {};

export default function ChatView() {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const [message, setMessage] = useState('');
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [pollDialogOpen, setPollDialogOpen] = useState(false);
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<number | null>(null);

  const directUserId =
    (location.state as any)?.directUserId && typeof (location.state as any).directUserId === 'string'
      ? ((location.state as any).directUserId as string)
      : null;

  const recordingIntervalRef = useRef<number | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingStreamRef = useRef<MediaStream | null>(null);
  const recordedChunksRef = useRef<BlobPart[]>([]);
  
  const conversation = useAppSelector((state) =>
    state.messages.conversations.find((c) => c.id === conversationId)
  );

  // When starting a direct chat from profile, the URL can temporarily contain a userId
  // until we redirect to the real conversation id. Prevent sending during that window.
  const sendConversationId = directUserId && !conversation ? undefined : conversationId;
  const conversationsStatus = useAppSelector((state) => state.messages.status);
  const myUserId = useAppSelector((state) => state.auth.user?.id ?? null);
  const token = useAppSelector((state) => state.auth.token);
  const messages = useAppSelector((state) => {
    if (!conversationId) return EMPTY_MESSAGES;
    return state.messages.messages[conversationId] ?? EMPTY_MESSAGES;
  });
  const typingMap = useAppSelector((state) => {
    if (!conversationId) return EMPTY_TYPING;
    return state.messages.typingByConversation[conversationId] ?? EMPTY_TYPING;
  });

  const resolveMediaURL = (url: string) => {
    if (!url) return url;
    if (/^https?:\/\//i.test(url)) return url;
    const rawBase = import.meta.env.VITE_API_URL || 'http://localhost:3500';
    const base = String(rawBase).replace(/\/+$/, '').replace(/\/api$/, '');
    return `${base}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  useEffect(() => {
    dispatch(connectInboxRealtime());
  }, [dispatch]);

  useEffect(() => {
    // Ensure conversations are loaded so we can distinguish:
    // - conversationId (existing conversation)
    // - userId (start/get direct conversation)
    if (conversationsStatus === 'idle') {
      dispatch(fetchConversations({ archived: false }));
      dispatch(fetchConversations({ archived: true }));
    }
  }, [conversationsStatus, dispatch]);

  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) {
        window.clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
      try {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
          mediaRecorderRef.current.ondataavailable = null;
          mediaRecorderRef.current.onstop = null;
          mediaRecorderRef.current.stop();
        }
      } catch {
        // ignore
      }
      for (const t of recordingStreamRef.current?.getTracks?.() ?? []) t.stop();
      recordingStreamRef.current = null;
      mediaRecorderRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!conversationId) return;

    // If route param is a userId (coming from profile) and we don't have the conversation yet,
    // create/get the direct conversation then redirect to its real id.
    const ensureConversation = async () => {
      if (!directUserId) return;

      const res: any = await dispatch(createOrGetDirectConversation({ otherUserId: directUserId }));
      const newId = res?.payload?.conversation?.id;
      if (newId && typeof newId === 'string') {
        navigate(`/home/inbox/${newId}`, { replace: true });
      }
    };

    ensureConversation();
  }, [conversationId, conversation, conversationsStatus, directUserId, dispatch, navigate]);

  useEffect(() => {
    if (!conversationId) return;

    // If we came from profile (direct chat by userId), wait for the redirect
    // to the real conversation id before joining/fetching messages.
    if (directUserId && !conversation) return;

    dispatch(setCurrentConversation(conversationId));
    dispatch(fetchMessagesPage({ conversationId, limit: 50 }));

    return () => {
      if (typingTimeoutRef.current) {
        window.clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      dispatch(setTyping({ conversationId, isTyping: false }));
      dispatch(leaveConversation(conversationId));
      dispatch(setCurrentConversation(null));
    };
  }, [conversationId, conversation, directUserId, dispatch]);

  useEffect(() => {
    if (conversation?.userId) {
      dispatch(subscribePresence({ userIds: [conversation.userId] }));
    }
  }, [conversation?.userId, dispatch]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (message.trim() && conversationId) {
      dispatch(sendMessageRealtime({ conversationId, content: message, type: 'text' }));
      setMessage('');
    }
  };

  const handleSticker = (sticker: string) => {
    if (conversationId) {
      dispatch(sendMessageRealtime({ 
        conversationId, 
        content: sticker, 
        type: 'sticker',
        sticker 
      }));
      setShowMoreOptions(false);
    }
  };

  const handleImageSend = () => {
    imageInputRef.current?.click();
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !conversationId) return;

    try {
      let imageUrl: string | undefined;

      // Prefer direct Firebase Storage upload (shows under SakhiAyoub/inbox/images/).
      try {
        const uploaded = await uploadInboxImage(file, myUserId ?? 'anon');
        imageUrl = uploaded.url;
      } catch (err) {
        console.warn('[InboxStorage] Direct image upload failed; falling back to API', err);
        const form = new FormData();
        form.append('image', file);
        const res = await api.post('/inbox/uploads/image', form, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        imageUrl = res.data?.url as string | undefined;
      }

      if (!imageUrl) throw new Error('Missing upload url');

      dispatch(
        sendMessageRealtime({
          conversationId,
          content: 'Sent an image',
          type: 'image',
          image: imageUrl,
        })
      );
      toast.success('Image sent');
    } catch {
      toast.error('Failed to send image');
    } finally {
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !conversationId) return;

    try {
      let fileUrl: string | undefined;
      let resName: string | undefined;
      let resMime: string | undefined;
      let resSize: number | undefined;

      // Prefer direct Firebase Storage upload (shows under SakhiAyoub/inbox/files/).
      try {
        const uploaded = await uploadInboxFile(file, myUserId ?? 'anon');
        fileUrl = uploaded.url;
        resName = file.name;
        resMime = file.type;
        resSize = file.size;
      } catch (err) {
        console.warn('[InboxStorage] Direct file upload failed; falling back to API', err);
        const form = new FormData();
        form.append('file', file);
        const res = await api.post('/inbox/uploads/file', form, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        fileUrl = res.data?.url as string | undefined;
        resName = res.data?.name;
        resMime = res.data?.mimetype;
        resSize = typeof res.data?.size === 'number' ? res.data.size : undefined;
      }

      if (!fileUrl) throw new Error('Missing upload url');

      dispatch(
        sendMessageRealtime({
          conversationId,
          content: file.name,
          type: 'file',
          fileUrl,
          fileName: resName ?? file.name,
          fileMime: resMime ?? file.type,
          fileSize: typeof resSize === 'number' ? resSize : file.size,
        })
      );
      toast.success('File sent');
    } catch {
      toast.error('Failed to send file');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleLocationSend = () => {
    if (!conversationId) return;
    setShowMoreOptions(false);

    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported on this device');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        dispatch(
          sendMessageRealtime({
            conversationId,
            content: 'Shared location',
            type: 'location',
            location: {
              name: 'Current Location',
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
            },
          })
        );
      },
      () => {
        toast.error('Location permission denied');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      }
    );
  };

  const handlePollVote = (messageId: string, optionId: string | number) => {
    if (!conversationId) return;
    if (!token) {
      toast.error('You must be logged in');
      return;
    }
    const socket = getSocket(token);
    if (!socket) {
      toast.error('Realtime connection unavailable (Socket.IO)');
      return;
    }
    socket.emit('inbox:poll:vote', { conversationId, messageId, optionId });
  };

  const startRecording = async () => {
    if (!conversationId) return;
    if (isRecording) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recordingStreamRef.current = stream;

      recordedChunksRef.current = [];
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : '';

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) recordedChunksRef.current.push(ev.data);
      };

      setIsRecording(true);
      setRecordingTime(0);
      if (recordingIntervalRef.current) window.clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = window.setInterval(() => setRecordingTime((p) => p + 1), 1000);

      recorder.start();
    } catch {
      toast.error('Microphone permission denied');
      setIsRecording(false);
    }
  };

  const stopRecording = async () => {
    if (!conversationId) return;
    if (!isRecording) return;

    const duration = recordingTime;
    setIsRecording(false);
    setRecordingTime(0);
    if (recordingIntervalRef.current) {
      window.clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }

    const recorder = mediaRecorderRef.current;
    const stream = recordingStreamRef.current;

    if (!recorder || recorder.state === 'inactive') {
      for (const t of stream?.getTracks?.() ?? []) t.stop();
      recordingStreamRef.current = null;
      return;
    }

    recorder.onstop = async () => {
      try {
        const blob = new Blob(recordedChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        recordedChunksRef.current = [];

        for (const t of stream?.getTracks?.() ?? []) t.stop();
        recordingStreamRef.current = null;
        mediaRecorderRef.current = null;

        if (duration <= 0 || blob.size === 0) return;

        let voiceUrl: string | undefined;

        // Prefer direct Firebase Storage upload (shows under SakhiAyoub/inbox/audios/).
        try {
          const uploaded = await uploadInboxAudio(blob, myUserId ?? 'anon');
          voiceUrl = uploaded.url;
        } catch (err) {
          console.warn('[InboxStorage] Direct audio upload failed; falling back to API', err);
          const form = new FormData();
          form.append('audio', blob, `voice-${Date.now()}.webm`);
          const res = await api.post('/inbox/uploads/audio', form, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          voiceUrl = res.data?.url as string | undefined;
        }

        if (!voiceUrl) throw new Error('Missing upload url');

        dispatch(
          sendMessageRealtime({
            conversationId,
            content: 'Voice message',
            type: 'voice',
            voiceDuration: duration,
            voiceUrl,
          })
        );
      } catch {
        toast.error('Failed to send voice message');
      }
    };

    recorder.stop();
  };

  const toggleRecording = () => {
    if (isRecording) {
      void stopRecording();
    } else {
      void startRecording();
    }
  };

  const handleEmojiClick = (emojiData: any) => {
    setMessage(prev => prev + emojiData.emoji);
  };

  const renderMessageStatus = (status: string) => {
    switch (status) {
      case 'sending':
        return <Check className="w-3 h-3 text-[#718197] opacity-50" />;
      case 'sent':
        return <Check className="w-3 h-3 text-[#718197]" />;
      case 'delivered':
        return <CheckCheck className="w-3 h-3 text-[#718197]" />;
      case 'seen':
        return <CheckCheck className="w-3 h-3 text-[#18534F]" />;
      default:
        return null;
    }
  };

  const renderMessage = (msg: Message) => {
    const isSender = Boolean(myUserId && msg.senderId === myUserId);
    
    return (
      <div
        key={msg.id}
        className={`flex ${isSender ? 'justify-end' : 'justify-start'} mb-3`}
      >
        <div
          className={`max-w-[70%] rounded-2xl px-4 py-2 ${
            isSender
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted'
          }`}
        >
          {msg.type === 'text' && <p>{msg.content}</p>}
          
          {msg.type === 'sticker' && (
            <div className="text-5xl">{msg.sticker}</div>
          )}
          
          {msg.type === 'image' && msg.image && (
            <div>
              <img src={resolveMediaURL(msg.image)} alt="Shared" className="rounded-lg max-w-full" />
              <p className="mt-1 text-sm">{msg.content}</p>
            </div>
          )}

          {msg.type === 'file' && msg.fileUrl && (
            <div className="min-w-[240px]">
              <a
                href={resolveMediaURL(msg.fileUrl)}
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-2"
              >
                {msg.fileName || msg.content || 'Download file'}
              </a>
              {typeof msg.fileSize === 'number' ? (
                <div className="mt-1 text-xs opacity-70">{Math.round(msg.fileSize / 1024)} KB</div>
              ) : null}
            </div>
          )}
          
          {msg.type === 'poll' && msg.poll && (
            <div className="min-w-[250px]">
              <p className="font-semibold mb-2">{msg.poll.question}</p>
              <div className="space-y-2">
                {msg.poll.options.map((option: { id: string | number; text: string; votes: number }) => (
                  <button
                    key={String(option.id)}
                    className={`w-full text-left p-2 rounded ${
                      isSender ? 'bg-primary-foreground/20' : 'bg-background'
                    }`}
                    onClick={() => handlePollVote(msg.id, option.id)}
                  >
                    <div className="flex justify-between items-center">
                      <span>{option.text}</span>
                      <span className="text-sm opacity-70">{option.votes}</span>
                    </div>
                  </button>
                ))}
              </div>
              <p className="text-xs mt-2 opacity-70">{msg.poll.totalVotes} votes</p>
            </div>
          )}
          
          {msg.type === 'event' && msg.event && (
            <div className="min-w-[250px]">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4" />
                <p className="font-semibold">{msg.event.title}</p>
              </div>
              <p className="text-sm">{msg.event.date} at {msg.event.time}</p>
              {msg.event.location && (
                <p className="text-sm mt-1 opacity-70">{msg.event.location}</p>
              )}
            </div>
          )}
          
          {msg.type === 'location' && msg.location && (
            <div className="min-w-[250px]">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-4 h-4" />
                <p className="font-semibold">{msg.location.name}</p>
              </div>
              <div className="bg-muted rounded h-32 flex items-center justify-center">
                <MapPin className="w-8 h-8 opacity-50" />
              </div>
              <a
                className="mt-2 inline-block text-xs underline underline-offset-2"
                target="_blank"
                rel="noreferrer"
                href={`https://www.google.com/maps?q=${encodeURIComponent(
                  `${msg.location.lat},${msg.location.lng}`
                )}`}
              >
                Open in Maps
              </a>
            </div>
          )}
          
          {msg.type === 'voice' && (
            <div
              className={`min-w-[240px] rounded-md border p-2 ${
                isSender
                  ? 'bg-emerald-600/15 border-emerald-600/30'
                  : 'bg-slate-950/10 border-slate-950/20 dark:bg-white/10 dark:border-white/15'
              }`}
            >
              {msg.voiceUrl ? (
                <audio className="w-full" controls preload="none" src={resolveMediaURL(msg.voiceUrl)} />
              ) : (
                <div className="flex items-center gap-2 opacity-80">
                  <Play className="w-4 h-4" />
                  <span className="text-sm">Voice message</span>
                </div>
              )}
              {msg.voiceDuration ? <div className="mt-1 text-xs opacity-70">{msg.voiceDuration}s</div> : null}
            </div>
          )}
          
          <div className="flex items-center gap-1 mt-1">
            <span className="text-xs opacity-70">{msg.timestamp}</span>
            {isSender && (
              <span className="opacity-70">
                {renderMessageStatus(msg.status)}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (!conversation) return null;

  const otherIsTyping = Boolean(conversation?.userId && typingMap[conversation.userId]);

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col pb-[calc(5rem+env(safe-area-inset-bottom))] lg:pb-0">
      <div className="bg-card border-b border-border p-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-muted rounded-full">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="relative">
          <Avatar className="w-10 h-10">
            <AvatarImage src={conversation.avatar} />
            <AvatarFallback>{conversation.username[0].toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-card ${
            conversation.isOnline ? 'bg-green-500' : 'bg-gray-400'
          }`} />
        </div>
        <div className="flex-1">
          <h2 className="font-semibold">{conversation.username}</h2>
          <p className={`text-xs ${otherIsTyping ? 'text-[#18534F]' : 'text-muted-foreground'}`}>
            {otherIsTyping
              ? 'typing…'
              : conversation.isOnline
                ? 'Online'
                : `Active ${conversation.lastSeen ?? ''}`}
          </p>
        </div>
        <button
          className="p-2 hover:bg-muted rounded-full"
          onClick={() => {
            if (!conversation?.userId) return;
            if (!token) {
              toast.error('You must be logged in');
              return;
            }
            const socket = getSocket(token);
            if (!socket) {
              toast.error('Realtime connection unavailable (Socket.IO)');
              return;
            }
            socket?.emit('call:start', {
              calleeId: conversation.userId,
              callType: 'audio',
              conversationId: conversation.id,
            });
          }}
        >
          <Phone className="w-5 h-5 text-primary" />
        </button>
        <button
          className="p-2 hover:bg-muted rounded-full"
          onClick={() => {
            if (!conversation?.userId) return;
            if (!token) {
              toast.error('You must be logged in');
              return;
            }
            const socket = getSocket(token);
            if (!socket) {
              toast.error('Realtime connection unavailable (Socket.IO)');
              return;
            }
            socket?.emit('call:start', {
              calleeId: conversation.userId,
              callType: 'video',
              conversationId: conversation.id,
            });
          }}
        >
          <Video className="w-5 h-5 text-primary" />
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-2 hover:bg-muted rounded-full">
              <MoreVertical className="w-5 h-5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <DropdownMenuItem
              onClick={() => {
                if (!conversationId) return;
                dispatch(archiveConversation(conversationId));
                toast.success('Conversation archived');
              }}
            >
              <Archive className="w-4 h-4 mr-2" />
              Archive
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                if (!conversationId) return;
                dispatch(deleteConversation(conversationId));
                toast.success('Conversation deleted');
                navigate('/home/inbox');
              }}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                dispatch(blockUser(conversation.userId));
                toast.success('User blocked');
              }}
            >
              <Ban className="w-4 h-4 mr-2" />
              Block
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link
                to={`/home/profile/${encodeURIComponent(conversation.username || conversation.userId)}`}
                className="flex items-center"
              >
                <UserCircle className="w-4 h-4 mr-2" />
                View Profile
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {messages.map(renderMessage)}
        <div ref={messagesEndRef} />
      </div>

      <div className="bg-card border-t border-border p-4">
        {isRecording && (
          <div className="mb-2 flex items-center gap-2 rounded-lg border border-[#18534F]/15 bg-[#ECF8F6] px-3 py-2 text-[#18534F]">
            <div className="w-2 h-2 bg-[#18534F] rounded-full animate-pulse" />
            <span className="text-sm">Recording… {recordingTime}s</span>
          </div>
        )}
        
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="hidden"
        />

        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileChange}
          className="hidden"
        />
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => imageInputRef.current?.click()}
            className="text-muted-foreground hover:text-foreground shrink-0"
          >
            <ImageIcon className="w-5 h-5" />
          </Button>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground shrink-0"
              >
                <Smile className="w-5 h-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 border-0" align="start" side="top">
              <EmojiPicker
                onEmojiClick={handleEmojiClick}
                width={350}
                height={400}
              />
            </PopoverContent>
          </Popover>

          <Popover open={showMoreOptions}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground shrink-0"
                onClick={() => setShowMoreOptions((v) => !v)}
              >
                <Paperclip className="w-5 h-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              side="top"
              className="w-80"
              onEscapeKeyDown={() => setShowMoreOptions(false)}
              onInteractOutside={() => setShowMoreOptions(false)}
            >
              <div className="grid grid-cols-3 gap-2">
                <button 
                  onClick={handleImageSend}
                  className="flex flex-col items-center gap-2 p-3 hover:bg-muted rounded-lg"
                >
                  <div className="p-3 bg-primary rounded-full">
                    <ImageIcon className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <span className="text-xs">Photo</span>
                </button>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center gap-2 p-3 hover:bg-muted rounded-lg"
                >
                  <div className="p-3 bg-muted rounded-full">
                    <Paperclip className="w-5 h-5" />
                  </div>
                  <span className="text-xs">File</span>
                </button>
                
                <button
                  type="button"
                  onClick={() => {
                    setPollDialogOpen(true);
                    setShowMoreOptions(false);
                  }}
                  className="flex flex-col items-center gap-2 p-3 hover:bg-muted rounded-lg"
                >
                  <div className="p-3 bg-accent rounded-full">
                    <BarChart3 className="w-5 h-5 text-accent-foreground" />
                  </div>
                  <span className="text-xs">Poll</span>
                </button>
                
                <button
                  type="button"
                  onClick={() => {
                    setEventDialogOpen(true);
                    setShowMoreOptions(false);
                  }}
                  className="flex flex-col items-center gap-2 p-3 hover:bg-muted rounded-lg"
                >
                  <div className="p-3 bg-secondary rounded-full">
                    <Calendar className="w-5 h-5 text-secondary-foreground" />
                  </div>
                  <span className="text-xs">Event</span>
                </button>
                
                <button 
                  onClick={handleLocationSend}
                  className="flex flex-col items-center gap-2 p-3 hover:bg-muted rounded-lg"
                >
                  <div className="p-3 bg-destructive rounded-full">
                    <MapPin className="w-5 h-5 text-destructive-foreground" />
                  </div>
                  <span className="text-xs">Location</span>
                </button>
                
                <div className="col-span-3 mt-2">
                  <p className="text-xs font-semibold mb-2">Stickers</p>
                  <div className="grid grid-cols-5 gap-2">
                    {STICKERS.map((sticker, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSticker(sticker)}
                        className="text-2xl hover:scale-125 transition-transform"
                      >
                        {sticker}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Dialog open={pollDialogOpen} onOpenChange={setPollDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Poll</DialogTitle>
              </DialogHeader>
              <PollCreator
                conversationId={sendConversationId}
                onDone={() => {
                  setPollDialogOpen(false);
                }}
              />
            </DialogContent>
          </Dialog>

          <Dialog open={eventDialogOpen} onOpenChange={setEventDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Share Event</DialogTitle>
              </DialogHeader>
              <EventCreator
                conversationId={sendConversationId}
                onDone={() => {
                  setEventDialogOpen(false);
                }}
              />
            </DialogContent>
          </Dialog>
          
          <Input
            value={message}
            onChange={(e) => {
              const v = e.target.value;
              setMessage(v);
              if (!conversationId) return;

              dispatch(setTyping({ conversationId, isTyping: v.length > 0 }));

              if (typingTimeoutRef.current) {
                window.clearTimeout(typingTimeoutRef.current);
              }
              typingTimeoutRef.current = window.setTimeout(() => {
                dispatch(setTyping({ conversationId, isTyping: false }));
              }, 900);
            }}
            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Message..."
            className="flex-1"
            disabled={isRecording}
          />
          
          {message.trim() ? (
            <Button
              onClick={handleSend}
              size="icon"
              className="bg-[#d6955b] hover:bg-[#c58549] shrink-0"
            >
              <Send className="w-5 h-5" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleRecording}
              className={`shrink-0 ${isRecording ? 'bg-[#18534F] text-white hover:bg-[#143f3b]' : 'text-muted-foreground hover:text-foreground hover:bg-[#ECF8F6]'}`}
            >
              <Mic className="w-5 h-5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function PollCreator({
  conversationId,
  onDone,
}: {
  conversationId?: string;
  onDone: () => void;
}) {
  const dispatch = useAppDispatch();
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);

  const handleCreate = () => {
    if (!conversationId) {
      toast.error('Conversation not ready');
      return;
    }
    if (!question.trim() || !options.every((o) => o.trim())) {
      toast.error('Please fill the question and all options');
      return;
    }

    dispatch(
      sendMessageRealtime({
        conversationId,
        content: question,
        type: 'poll',
        poll: {
          question,
          options: options.map((text, idx) => ({
            id: idx.toString(),
            text,
            votes: 0,
          })),
          totalVotes: 0,
        },
      })
    );
    onDone();
  };

  return (
    <div className="space-y-4">
      <Input
        placeholder="Ask a question..."
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
      />
      {options.map((opt, idx) => (
        <Input
          key={idx}
          placeholder={`Option ${idx + 1}`}
          value={opt}
          onChange={(e) => {
            const newOptions = [...options];
            newOptions[idx] = e.target.value;
            setOptions(newOptions);
          }}
        />
      ))}
      <Button type="button" onClick={handleCreate} className="w-full bg-[#d6955b] hover:bg-[#c58549]">
        Create Poll
      </Button>
    </div>
  );
}

function EventCreator({
  conversationId,
  onDone,
}: {
  conversationId?: string;
  onDone: () => void;
}) {
  const dispatch = useAppDispatch();
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');

  const handleCreate = () => {
    if (!conversationId) {
      toast.error('Conversation not ready');
      return;
    }
    if (!title.trim() || !date || !time) {
      toast.error('Please fill title, date and time');
      return;
    }

    dispatch(
      sendMessageRealtime({
        conversationId,
        content: `Event: ${title}`,
        type: 'event',
        event: {
          title,
          date,
          time,
          location: location || undefined,
        },
      })
    );
    onDone();
  };

  return (
    <div className="space-y-4">
      <Input
        placeholder="Event title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <Input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
      />
      <Input
        type="time"
        value={time}
        onChange={(e) => setTime(e.target.value)}
      />
      <Input
        placeholder="Location (optional)"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
      />
      <Button type="button" onClick={handleCreate} className="w-full bg-[#d6955b] hover:bg-[#c58549]">
        Share Event
      </Button>
    </div>
  );
}
