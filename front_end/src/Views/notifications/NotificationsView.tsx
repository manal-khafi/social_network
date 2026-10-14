import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Notification } from '../../features/notifications/notificationsSlice';
import { useAppSelector, useAppDispatch } from '../../hooks';
import {
  deleteNotification,
  fetchNotifications,
  markAllAsRead,
  markAsRead,
} from '../../features/notifications/notificationsSlice';
import { formatTime } from '../../utils/timeUtils';
import { useTimeTicker } from '../../hooks/useTimeTicker';
import { acceptFollowRequest, denyFollowRequest, fetchFollowRequests } from '../../features/user/userSlice';
import { Card } from '../../Components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '../../Components/ui/avatar';
import { Button } from '../../Components/ui/button';
import { Separator } from '../../Components/ui/separator';
import { Heart, MessageCircle, UserPlus, UserCheck, Repeat, AtSign, Bell, Check, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';


import { useTranslation } from 'react-i18next';

export default function NotificationsView() {
  const { t } = useTranslation();
  useTimeTicker();
  const { notifications, nextCursor, status, unreadCount } = useAppSelector((state) => state.notifications);
  const isLoading = status === 'loading';
  const { followRequests } = useAppSelector((state) => state.user);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const myId = useAppSelector((state) => state.user.currentUser?.id ?? state.auth.user?.id);

  /** Where tapping a notification goes: the post, the story or the person. */
  const openNotification = (n: Notification) => {
    if (!n.isRead) dispatch(markAsRead(n.id));
    const meta = (n.metadata ?? {}) as Record<string, unknown>;
    const str = (v: unknown) => (typeof v === 'string' && v ? v : null);

    if (n.sourceType === 'story' || n.type.startsWith('story_')) {
      // A mention / reshare is about the actor's story; the other story
      // notifications (views, likes, replies...) are about the user's own.
      const owner =
        str(meta.story_owner_id) ??
        (n.type === 'mention' || n.type === 'story_reshare' ? n.actor?.id : myId) ??
        null;
      if (owner) navigate(`/home/stories/${owner}`);
      return;
    }
    const postId = str(meta.post_id) ?? (n.sourceType === 'post' ? n.sourceId : null);
    if (postId) {
      const showComments = ['comment', 'reply', 'mention'].includes(n.type) && !!meta.comment_id;
      navigate(`/home/post/${postId}${showComments ? '?comments=1' : ''}`);
      return;
    }
    if (n.actor?.username) navigate(`/home/profile/${encodeURIComponent(n.actor.username)}`);
  };

  const handleAcceptRequest = (requestId: string, username: string) => {
    dispatch(acceptFollowRequest(requestId));
    toast.success(t('notifications.acceptedRequest', { username }));
  };

  const handleDenyRequest = (requestId: string, username: string) => {
    dispatch(denyFollowRequest(requestId));
    toast.success(t('notifications.deniedRequest', { username }));
  };

  useEffect(() => {
    dispatch(fetchFollowRequests());
    dispatch(fetchNotifications());
  }, [dispatch]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'like': return <Heart className="w-5 h-5 text-red-500" />;
      case 'comment':
      case 'reply': return <MessageCircle className="w-5 h-5 text-blue-500" />;
      case 'follow':
      case 'follow_request': return <UserPlus className="w-5 h-5 text-green-500" />;
      case 'follow_accepted': return <UserCheck className="w-5 h-5 text-green-500" />;
      case 'repost': return <Repeat className="w-5 h-5 text-purple-500" />;
      case 'mention': return <AtSign className="w-5 h-5 text-amber-500" />;
      // story_view, story_like, story_comment, ...
      default: return <Bell className="w-5 h-5 text-muted-foreground" />;
    }
  };

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">{t("notifications.title")}</h2>
        <Button
          variant="ghost"
          size="sm"
          disabled={unreadCount === 0}
          onClick={() => dispatch(markAllAsRead())}
        >
          {t("notifications.markAllRead")}
        </Button>
      </div>

      {/* Follow Requests Section */}
      {followRequests.length > 0 && (
        <>
          <div>
            <div className="flex items-center gap-2 mb-3">
              <UserPlus className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">{t("notifications.followRequests")}</h3>
              <span className="text-xs bg-primary text-primary-foreground rounded-full px-2 py-0.5">
                {followRequests.length}
              </span>
            </div>
            <div className="space-y-2">
              {followRequests.map((request) => (
                <Card key={request.requestId} className="p-4">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={request.user.avatar_url ?? undefined} />
                      <AvatarFallback>{request.user.username[0].toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">
                        {request.user.display_name ?? request.user.username}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">@{request.user.username}</p>
                      {request.user.bio && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{request.user.bio}</p>
                      )}
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Button
                        size="sm"
                        onClick={() => handleAcceptRequest(request.requestId, request.user.username)}
                        className="bg-[#d6955b] hover:bg-[#c58549]"
                      >
                        <Check className="w-4 h-4 me-1" />
                        {t("notifications.accept")}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDenyRequest(request.requestId, request.user.username)}
                      >
                        <X className="w-4 h-4 me-1" />
                        {t("notifications.deny")}
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
          
          <Separator />
        </>
      )}

      {/* Regular Notifications */}
      <div>
        <h3 className="font-semibold mb-3">{t("notifications.recentActivity")}</h3>
        {notifications.length === 0 && !isLoading && (
          <p className="text-sm text-muted-foreground text-center py-8">
            {status === 'failed' ? t("notifications.couldNotLoadNotifications") : t("notifications.noNotificationsYet")}
          </p>
        )}

        <div className="space-y-2">
          {notifications.map((notif) => {
            const actorName = notif.actor?.display_name || notif.actor?.username || '';
            return (
              <Card
                key={notif.id}
                className={`p-4 cursor-pointer transition-colors ${!notif.isRead ? 'bg-muted/30 border-primary/20' : ''}`}
                onClick={() => openNotification(notif)}
              >
                <div className="flex gap-3">
                  <Avatar>
                    <AvatarImage src={notif.actor?.avatar_url ?? undefined} />
                    <AvatarFallback>{(actorName[0] ?? '?').toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2">
                      <span className="mt-1">{getIcon(notif.type)}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm break-words">{notif.message}</p>
                        <span className="text-xs text-muted-foreground">{formatTime(notif.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-shrink-0 text-muted-foreground"
                    aria-label={t("notifications.deleteNotification")}
                    onClick={(e) => {
                      e.stopPropagation();
                      dispatch(deleteNotification(notif.id));
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>

        {isLoading && (
          <div className="flex justify-center py-4">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {nextCursor && !isLoading && (
          <div className="flex justify-center pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => dispatch(fetchNotifications({ cursor: nextCursor }))}
            >
              {t("actions.loadMore")}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
