import { useAppSelector, useAppDispatch } from '../../hooks';
import { markAsRead, markAllAsRead } from '../../features/notifications/notificationsSlice';
import { acceptFollowRequest, denyFollowRequest } from '../../features/user/userSlice';
import { Card } from '../../components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '../../components/ui/avatar';
import { Button } from '../../components/ui/button';
import { Separator } from '../../components/ui/separator';
import { Heart, MessageCircle, UserPlus, Repeat, Check, X } from 'lucide-react';
import { toast } from 'sonner';

export default function NotificationsView() {
  const { notifications } = useAppSelector((state) => state.notifications);
  const { followRequests } = useAppSelector((state) => state.user);
  const dispatch = useAppDispatch();

  const handleAcceptRequest = (userId: string, username: string) => {
    dispatch(acceptFollowRequest(userId));
    toast.success(`Accepted ${username}'s follow request`);
  };

  const handleDenyRequest = (userId: string, username: string) => {
    dispatch(denyFollowRequest(userId));
    toast.success(`Denied ${username}'s follow request`);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'like': return <Heart className="w-5 h-5 text-red-500" />;
      case 'comment': return <MessageCircle className="w-5 h-5 text-blue-500" />;
      case 'follow': return <UserPlus className="w-5 h-5 text-green-500" />;
      case 'repost': return <Repeat className="w-5 h-5 text-purple-500" />;
      default: return null;
    }
  };

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Notifications</h2>
        <Button
          variant="ghost"
          size="sm"
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
              {followRequests.map((user) => (
                <Card key={user.id} className="p-4">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback>{user.username[0].toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{user.fullName}</p>
                      <p className="text-sm text-muted-foreground truncate">@{user.username}</p>
                      {user.bio && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{user.bio}</p>
                      )}
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Button
                        size="sm"
                        onClick={() => handleAcceptRequest(user.id, user.username)}
                        className="bg-[#d6955b] hover:bg-[#c58549]"
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDenyRequest(user.id, user.username)}
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
        <div className="space-y-2">
          {notifications.map((notif) => (
            <Card
              key={notif.id}
              className={`p-4 cursor-pointer transition-colors ${!notif.isRead ? 'bg-muted/30 border-primary/20' : ''}`}
              onClick={() => dispatch(markAsRead(notif.id))}
            >
              <div className="flex gap-3">
                <Avatar>
                  <AvatarImage src={notif.avatar} />
                  <AvatarFallback>{notif.username[0].toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-start gap-2">
                    <span className="mt-1">{getIcon(notif.type)}</span>
                    <div className="flex-1">
                      <p className="text-sm">
                        <span className="font-semibold">{notif.username}</span>{' '}
                        {notif.content}
                      </p>
                      <span className="text-xs text-muted-foreground">{notif.timestamp}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}