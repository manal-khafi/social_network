import { useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '../../hooks';
import {
  deleteNotification,
  fetchNotifications,
  markAllAsRead,
  markAsRead,
} from '../../features/notifications/notificationsSlice';
import { formatTime } from '../../utils/timeUtils';
import { acceptFollowRequest, denyFollowRequest, fetchFollowRequests } from '../../features/user/userSlice';
import { Card } from '../../Components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '../../Components/ui/avatar';
import { Button } from '../../Components/ui/button';
import { Separator } from '../../Components/ui/separator';
import { Heart, MessageCircle, UserPlus, UserCheck, Repeat, AtSign, Bell, Check, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function NotificationsView() {
  const { notifications, nextCursor, status, unreadCount } = useAppSelector((state) => state.notifications);
  const isLoading = status === 'loading';
  const { followRequests } = useAppSelector((state) => state.user);
  const dispatch = useAppDispatch();

  const handleAcceptRequest = (requestId: string, username: string) => {
    dispatch(acceptFollowRequest(requestId));
    toast.success(`Accepted ${username}'s follow request`);
  };

  const handleDenyRequest = (requestId: string, username: string) => {
    dispatch(denyFollowRequest(requestId));
    toast.success(`Denied ${username}'s follow request`);
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
        <h2 className="text-xl font-semibold">Notifications</h2>
        <Button
          variant="ghost"
          size="sm"
          disabled={unreadCount === 0}
          onClick={() => dispatch(markAllAsRead())}
        >
          Mark all as read
        </Button>
      </div>

      {/* Follow Requests Section */}
      {followRequests.length > 0 && (
        <>
          <div>
            <div className="flex items-center gap-2 mb-3">
              <UserPlus className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">Follow Requests</h3>
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
                        <Check className="w-4 h-4 mr-1" />
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDenyRequest(request.requestId, request.user.username)}
                      >
                        <X className="w-4 h-4 mr-1" />
                        Deny
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
        <h3 className="font-semibold mb-3">Recent Activity</h3>
        {notifications.length === 0 && !isLoading && (
          <p className="text-sm text-muted-foreground text-center py-8">
            {status === 'failed' ? 'Could not load notifications.' : 'No notifications yet.'}
          </p>
        )}

        <div className="space-y-2">
          {notifications.map((notif) => {
            const actorName = notif.actor?.display_name || notif.actor?.username || '';
            return (
              <Card
                key={notif.id}
                className={`p-4 cursor-pointer transition-colors ${!notif.isRead ? 'bg-muted/30 border-primary/20' : ''}`}
                onClick={() => {
                  if (!notif.isRead) dispatch(markAsRead(notif.id));
                }}
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
                    aria-label="Delete notification"
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
              Load more
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
