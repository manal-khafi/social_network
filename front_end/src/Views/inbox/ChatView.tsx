import { useState, useEffect, useRef, Fragment } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../hooks';
import {
  sendMessage,
  setCurrentConversation,
  archiveConversation,
  deleteConversation,
  fetchConversations,
  fetchArchivedConversations,
  fetchConversation,
  fetchMessages,
  markRead,
  openDirectByUserId,
  isSeenBy,
} from '../../features/messages/messagesSlice';
import { blockUser } from '../../features/user/userSlice';
import type { Message, MessageLocation } from '../../features/messages/messagesSlice';
import { useCall } from '../../features/call/CallProvider';
import { 
  ArrowLeft, Send, Smile, Image as ImageIcon, Mic, Paperclip, 
  Phone, Video, MoreVertical, CheckCheck, Check, MapPin, 
  Calendar, BarChart3, Play, Archive, Ban, Trash2, UserCircle, X, Loader2
} from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '../../Components/ui/avatar';
import { Input } from '../../Components/ui/input';
import { Button } from '../../Components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../Components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '../../Components/ui/popover';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '../../Components/ui/dropdown-menu';
import { toast } from 'sonner';
import EmojiPicker from 'emoji-picker-react';
import { uploadPostMedia } from '../../utils/uploadStoryMedia';

// The chat is a full-screen layer at z-[60]; portalled popovers, menus and
// dialogs default to z-50 and would open behind it.
const ABOVE_CHAT = 'z-[70]';

const STICKERS = [
  '👍', '❤️', '😂', '😮', '😢', '🙏', '👏', '🔥', '🎉', '💯'
];

export default function ChatView() {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [message, setMessage] = useState('');
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [attachment, setAttachment] = useState<{ file: File; previewUrl: string } | null>(null);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const myId = useAppSelector((state) => state.auth.user?.id);
  const conversation = useAppSelector(
    (state) =>
      state.messages.conversations.find((c) => c.id === conversationId) ??
      state.messages.archivedConversations.find((c) => c.id === conversationId)
  );
  const messages = useAppSelector((state) => {
    if (!conversationId) return [];
    return state.messages.messages[conversationId] || [];
  });
  const convStatus = useAppSelector((state) => state.messages.status);
  const { startCall } = useCall();

  useEffect(() => {
    dispatch(fetchConversations());
    dispatch(fetchArchivedConversations());
  }, [dispatch]);

  // The route param is usually a conversation id, but can be a user id ("Message"
  // from a profile). Try to load it as a conversation first; only if that 404s
  // treat it as a user id and open/create the DM.
  useEffect(() => {
    if (!conversationId || conversation || convStatus !== 'succeeded') return;
    dispatch(fetchConversation(conversationId))
      .unwrap()
      .catch(() => {
        dispatch(openDirectByUserId(conversationId))
          .unwrap()
          .then((realId: string) => {
            dispatch(fetchConversations());
            if (realId !== conversationId) navigate(`/home/inbox/${realId}`, { replace: true });
          })
          .catch(() => navigate('/home/inbox', { replace: true }));
      });
  }, [conversationId, conversation, convStatus, dispatch, navigate]);

  useEffect(() => {
    if (conversationId) {
      dispatch(setCurrentConversation(conversationId));
      dispatch(fetchMessages(conversationId));
      dispatch(markRead(conversationId));
    }
    return () => {
      dispatch(setCurrentConversation(null));
    };
  }, [conversationId, dispatch]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // A message that arrives while this chat is open has been read: tell the
  // server, or it would count as unread again after a reload.
  const lastMessage = messages[messages.length - 1];
  const lastIncomingId = lastMessage && lastMessage.senderId !== myId ? lastMessage.id : undefined;
  useEffect(() => {
    if (conversationId && lastIncomingId) dispatch(markRead(conversationId));
  }, [conversationId, lastIncomingId, dispatch]);

  const clearAttachment = () => {
    setAttachment((prev) => {
      if (prev) URL.revokeObjectURL(prev.previewUrl);
      return null;
    });
  };

  // Drop the pending attachment (and its preview URL) when leaving the chat.
  useEffect(() => clearAttachment, [conversationId]);

  const handleSend = async () => {
    if (!conversationId || isSending) return;
    const text = message.trim();
    if (!text && !attachment) return;

    if (attachment) {
      setIsSending(true);
      try {
        const { url, type } = await uploadPostMedia(attachment.file);
        await dispatch(
          sendMessage({
            conversationId,
            content: '',
            type,
            ...(type === 'video' ? { video: url } : { image: url }),
          })
        ).unwrap();
        clearAttachment();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to send attachment');
        return;
      } finally {
        setIsSending(false);
      }
    }

    if (text) {
      dispatch(sendMessage({ conversationId, content: text, type: 'text' }));
      setMessage('');
    }
  };

  const handleSticker = (sticker: string) => {
    if (conversationId) {
      dispatch(sendMessage({ 
        conversationId, 
        content: sticker, 
        type: 'sticker',
        sticker 
      }));
      setShowMoreOptions(false);
    }
  };

  const handleImageSend = () => {
    setShowMoreOptions(false);
    fileInputRef.current?.click();
  };

  // Picking a file only stages it (preview above the input); it is uploaded
  // and sent by handleSend.
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Reset the input so the same file can be picked again
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      toast.error('Choose an image or a video');
      return;
    }
    clearAttachment();
    setAttachment({ file, previewUrl: URL.createObjectURL(file) });
  };

  const handleLocationSend = () => {
    if (!conversationId) return;
    setShowMoreOptions(false);
    if (!navigator.geolocation) {
      toast.error('Location is not available in this browser');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        dispatch(sendMessage({
          conversationId,
          content: 'Shared location',
          type: 'location',
          location: {
            name: 'Shared location',
            lat: coords.latitude,
            lng: coords.longitude
          }
        }));
      },
      (err) => {
        toast.error(
          err.code === err.PERMISSION_DENIED
            ? 'Allow location access to share your location'
            : 'Could not get your location'
        );
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const toggleRecording = () => {
    if (!isRecording) {
      setIsRecording(true);
      setRecordingTime(0);
      const interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      (window as any).recordingInterval = interval;
    } else {
      setIsRecording(false);
      clearInterval((window as any).recordingInterval);
      if (conversationId && recordingTime > 0) {
        dispatch(sendMessage({ 
          conversationId, 
          content: 'Voice message', 
          type: 'voice',
          voiceDuration: recordingTime
        }));
      }
      setRecordingTime(0);
    }
  };

  const handleEmojiClick = (emojiData: any) => {
    setMessage(prev => prev + emojiData.emoji);
  };

  const renderMessageStatus = (status: string) => {
    switch (status) {
      case 'sent':
        return <Check className="w-3 h-3" />;
      case 'delivered':
      case 'seen':
        return <CheckCheck className="w-3 h-3" />;
      default:
        return null;
    }
  };

  // Read receipt: the last of my messages the other participant has read.
  // (otherLastReadAt stays empty when they turned read receipts off.)
  let seenMessageId: string | undefined;
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (m.senderId === myId && m.type !== 'call' && isSeenBy(conversation?.otherLastReadAt, m.createdAt)) {
      seenMessageId = m.id;
      break;
    }
  }

  const renderMessage = (msg: Message) => {
    const isSender = msg.senderId === myId;

    if (msg.type === 'call') {
      const cm = msg.callMeta;
      const kind = cm?.callType === 'video' ? 'Video call' : 'Voice call';
      const detail =
        cm?.status === 'missed'
          ? 'Missed'
          : cm?.status === 'declined'
          ? 'Declined'
          : cm?.durationSec
          ? `${Math.floor(cm.durationSec / 60)}:${String(cm.durationSec % 60).padStart(2, '0')}`
          : 'Ended';
      return (
        <div key={msg.id} className="flex justify-center my-2">
          <span className="text-xs text-muted-foreground bg-muted rounded-full px-3 py-1 flex items-center gap-1">
            <Phone className="w-3 h-3" />
            {kind} · {detail}
          </span>
        </div>
      );
    }

    return (
      <Fragment key={msg.id}>
      <div
        className={`flex ${isSender ? 'justify-end' : 'justify-start'} mb-2`}
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
              <img src={msg.image} alt="Shared" className="rounded-lg max-w-full" />
              {msg.content && <p className="mt-1 text-sm">{msg.content}</p>}
            </div>
          )}

          {msg.type === 'video' && msg.video && (
            <video src={msg.video} controls playsInline className="rounded-lg max-w-full" />
          )}
          
          {msg.type === 'poll' && msg.poll && (
            <div className="min-w-[250px]">
              <p className="font-semibold mb-2">{msg.poll.question}</p>
              <div className="space-y-2">
                {msg.poll.options.map(option => (
                  <button
                    key={option.id}
                    className={`w-full text-left p-2 rounded ${
                      isSender ? 'bg-primary-foreground/20' : 'bg-background'
                    }`}
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
          
          {msg.type === 'location' && <LocationCard location={msg.location} />}
          
          {msg.type === 'voice' && msg.voiceDuration && (
            <div className="flex items-center gap-3 min-w-[200px]">
              <button className="p-2 rounded-full bg-primary-foreground/20">
                <Play className="w-4 h-4" />
              </button>
              <div className="flex-1 h-1 bg-primary-foreground/20 rounded-full">
                <div className="h-full w-1/3 bg-primary-foreground/60 rounded-full" />
              </div>
              <span className="text-sm">{msg.voiceDuration}s</span>
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
      {msg.id === seenMessageId && (
        <div className="flex justify-end items-center gap-1 -mt-1 mb-2 text-xs text-muted-foreground">
          {conversation?.avatar && (
            <Avatar className="w-4 h-4">
              <AvatarImage src={conversation.avatar} />
              <AvatarFallback />
            </Avatar>
          )}
          <span>Seen</span>
        </div>
      )}
      </Fragment>
    );
  };

  if (!conversation) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3 text-muted-foreground">
        <div className="w-8 h-8 rounded-full border-2 border-muted border-t-primary animate-spin" />
        <p className="text-sm">Loading conversation…</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-background z-[60] flex flex-col h-[100dvh]">
      <div className="bg-card border-b border-border p-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-muted rounded-full">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="relative">
          <Avatar className="w-10 h-10">
            <AvatarImage src={conversation.avatar} />
            <AvatarFallback>{conversation.username?.[0]?.toUpperCase() ?? "?"}</AvatarFallback>
          </Avatar>
          {conversation.isOnline && (
            <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-card bg-green-500" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold truncate">{conversation.username}</h2>
          {conversation.isOnline && (
            <p className="text-xs text-muted-foreground">Online</p>
          )}
        </div>
        <button
          className="p-2 hover:bg-muted rounded-full disabled:opacity-40"
          disabled={!conversation?.userId}
          onClick={() =>
            conversation?.userId &&
            startCall(
              { id: conversation.userId, username: conversation.username, avatar: conversation.avatar },
              'audio'
            )
          }
          aria-label="Voice call"
        >
          <Phone className="w-5 h-5 text-primary" />
        </button>
        <button
          className="p-2 hover:bg-muted rounded-full disabled:opacity-40"
          disabled={!conversation?.userId}
          onClick={() =>
            conversation?.userId &&
            startCall(
              { id: conversation.userId, username: conversation.username, avatar: conversation.avatar },
              'video'
            )
          }
          aria-label="Video call"
        >
          <Video className="w-5 h-5 text-primary" />
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-2 hover:bg-muted rounded-full">
              <MoreVertical className="w-5 h-5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className={`w-56 ${ABOVE_CHAT}`}>
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
                navigate('/inbox');
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

      <div className="bg-card border-t border-border p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        {isRecording && (
          <div className="mb-2 flex items-center gap-2 text-red-500 animate-pulse">
            <div className="w-2 h-2 bg-red-500 rounded-full" />
            <span className="text-sm">Recording... {recordingTime}s</span>
          </div>
        )}
        
        {attachment && (
          <div className="mb-2 flex items-center gap-3">
            <div className="relative">
              {attachment.file.type.startsWith('video/') ? (
                <video src={attachment.previewUrl} muted className="h-20 w-20 rounded-lg object-cover" />
              ) : (
                <img src={attachment.previewUrl} alt="Attachment preview" className="h-20 w-20 rounded-lg object-cover" />
              )}
              {isSending ? (
                <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/40">
                  <Loader2 className="w-5 h-5 text-white animate-spin" />
                </div>
              ) : (
                <button
                  onClick={clearAttachment}
                  className="absolute -top-2 -right-2 rounded-full bg-foreground p-1 text-background"
                  aria-label="Remove attachment"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
            <span className="text-sm text-muted-foreground truncate">{attachment.file.name}</span>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          onChange={handleFileChange}
          className="hidden"
        />
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            className="text-muted-foreground hover:text-foreground shrink-0"
          >
            <ImageIcon className="w-5 h-5" />
          </Button>

          <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground shrink-0"
                aria-label="Emoji"
              >
                <Smile className="w-5 h-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className={`w-auto p-0 border-0 ${ABOVE_CHAT}`} align="start" side="top">
              <EmojiPicker
                onEmojiClick={handleEmojiClick}
                width={350}
                height={400}
              />
            </PopoverContent>
          </Popover>

          <Popover open={showMoreOptions} onOpenChange={setShowMoreOptions}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground shrink-0"
                aria-label="Attach"
              >
                <Paperclip className="w-5 h-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent side="top" className={`w-80 ${ABOVE_CHAT}`}>
              <div className="grid grid-cols-3 gap-2">
                <button 
                  onClick={handleImageSend}
                  className="flex flex-col items-center gap-2 p-3 hover:bg-muted rounded-lg"
                >
                  <div className="p-3 bg-primary rounded-full">
                    <ImageIcon className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <span className="text-xs">Photo / Video</span>
                </button>
                
                <Dialog>
                  <DialogTrigger asChild>
                    <button className="flex flex-col items-center gap-2 p-3 hover:bg-muted rounded-lg">
                      <div className="p-3 bg-accent rounded-full">
                        <BarChart3 className="w-5 h-5 text-accent-foreground" />
                      </div>
                      <span className="text-xs">Poll</span>
                    </button>
                  </DialogTrigger>
                  <DialogContent className={ABOVE_CHAT}>
                    <DialogHeader>
                      <DialogTitle>Create Poll</DialogTitle>
                    </DialogHeader>
                    <PollCreator conversationId={conversationId || ''} onClose={() => setShowMoreOptions(false)} />
                  </DialogContent>
                </Dialog>
                
                <Dialog>
                  <DialogTrigger asChild>
                    <button className="flex flex-col items-center gap-2 p-3 hover:bg-muted rounded-lg">
                      <div className="p-3 bg-secondary rounded-full">
                        <Calendar className="w-5 h-5 text-secondary-foreground" />
                      </div>
                      <span className="text-xs">Event</span>
                    </button>
                  </DialogTrigger>
                  <DialogContent className={ABOVE_CHAT}>
                    <DialogHeader>
                      <DialogTitle>Share Event</DialogTitle>
                    </DialogHeader>
                    <EventCreator conversationId={conversationId || ''} onClose={() => setShowMoreOptions(false)} />
                  </DialogContent>
                </Dialog>
                
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
          
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Message..."
            className="flex-1"
            disabled={isRecording}
          />
          
          {message.trim() || attachment ? (
            <Button
              onClick={handleSend}
              size="icon"
              disabled={isSending}
              className="bg-[#d6955b] hover:bg-[#c58549] shrink-0"
            >
              {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleRecording}
              className={`shrink-0 ${isRecording ? 'bg-red-500 text-white hover:bg-red-600' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <Mic className="w-5 h-5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

const MAP_ZOOM = 15;

/**
 * Map card for a shared location: the OpenStreetMap tile containing the point
 * with a pin on it, linking to the full map. Falls back to a plain card when
 * the message has no usable coordinates.
 */
function LocationCard({ location }: { location?: MessageLocation }) {
  if (!location) {
    return (
      <div className="flex items-center gap-2 min-w-[200px]">
        <MapPin className="w-4 h-4" />
        <p className="font-semibold">Location unavailable</p>
      </div>
    );
  }

  const { lat, lng } = location;
  // Web Mercator: fractional tile coordinates of the point at MAP_ZOOM.
  const n = 2 ** MAP_ZOOM;
  const latRad = (lat * Math.PI) / 180;
  const x = ((lng + 180) / 360) * n;
  const y = ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n;
  const tileX = Math.min(n - 1, Math.max(0, Math.floor(x)));
  const tileY = Math.min(n - 1, Math.max(0, Math.floor(y)));
  const mapUrl = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=${MAP_ZOOM}/${lat}/${lng}`;

  return (
    <div className="w-[250px] max-w-full">
      <div className="flex items-center gap-2 mb-2">
        <MapPin className="w-4 h-4" />
        <p className="font-semibold">Shared location</p>
      </div>
      <a
        href={mapUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="relative block aspect-square overflow-hidden rounded-lg bg-muted"
        aria-label="Open location in OpenStreetMap"
      >
        <img
          src={`https://tile.openstreetmap.org/${MAP_ZOOM}/${tileX}/${tileY}.png`}
          alt="Map"
          loading="lazy"
          className="h-full w-full"
        />
        <MapPin
          className="absolute w-7 h-7 -translate-x-1/2 -translate-y-full text-red-600 fill-red-200 drop-shadow"
          style={{ left: `${(x - tileX) * 100}%`, top: `${(y - tileY) * 100}%` }}
        />
        <span className="absolute bottom-0 right-0 bg-white/80 px-1 text-[10px] text-black">
          © OpenStreetMap
        </span>
      </a>
      <a
        href={mapUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-1 inline-block text-sm underline"
      >
        View location
      </a>
    </div>
  );
}

function PollCreator({ conversationId, onClose }: { conversationId: string; onClose: () => void }) {
  const dispatch = useAppDispatch();
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);

  const handleCreate = () => {
    if (question.trim() && options.every(o => o.trim())) {
      dispatch(sendMessage({
        conversationId,
        content: question,
        type: 'poll',
        poll: {
          question,
          options: options.map((text, idx) => ({
            id: idx.toString(),
            text,
            votes: 0
          })),
          totalVotes: 0
        }
      }));
      onClose();
    }
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
      <Button onClick={handleCreate} className="w-full bg-[#d6955b] hover:bg-[#c58549]">
        Create Poll
      </Button>
    </div>
  );
}

function EventCreator({ conversationId, onClose }: { conversationId: string; onClose: () => void }) {
  const dispatch = useAppDispatch();
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');

  const handleCreate = () => {
    if (title.trim() && date && time) {
      dispatch(sendMessage({
        conversationId,
        content: `Event: ${title}`,
        type: 'event',
        event: {
          title,
          date,
          time,
          location: location || undefined
        }
      }));
      onClose();
    }
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
      <Button onClick={handleCreate} className="w-full bg-[#d6955b] hover:bg-[#c58549]">
        Share Event
      </Button>
    </div>
  );
}
