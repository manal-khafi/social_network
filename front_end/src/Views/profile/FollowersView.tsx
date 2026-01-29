import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../hooks';
import { followUser, unfollowUser, fetchFollowers, fetchFollowing } from '../../features/user/userSlice';
import { Card } from '../../Components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '../../Components/ui/avatar';
import { Button } from '../../Components/ui/button';
import { toast } from 'sonner';

interface FollowersViewProps {
  type: 'followers' | 'following';
}

export default function FollowersView({ type }: FollowersViewProps) {
  const dispatch = useAppDispatch();
  const { userId } = useParams();
  const { followers, following } = useAppSelector((state) => state.user);
  const [followStates, setFollowStates] = useState<{ [key: string]: 'follow' | 'following' | 'requested' }>({});

  useEffect(() => {
    if (!userId) return;
    if (type === 'followers') {
      dispatch(fetchFollowers(userId));
    } else {
      dispatch(fetchFollowing(userId));
    }
  }, [dispatch, type, userId]);

  const list = type === 'followers' ? followers : following;

  const handleFollowToggle = (userId: string, isPrivate: boolean) => {
    const currentState = followStates[userId] || 'follow';
    
    if (currentState === 'follow') {
      dispatch(followUser(userId));
      if (!isPrivate) {
        setFollowStates(prev => ({ ...prev, [userId]: 'following' }));
        toast.success('Following user');
      } else {
        setFollowStates(prev => ({ ...prev, [userId]: 'requested' }));
        toast.success('Follow request sent');
      }
    } else {
      dispatch(unfollowUser(userId));
      setFollowStates(prev => ({ ...prev, [userId]: 'follow' }));
      toast.success('Unfollowed user');
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">
        {type === 'followers' ? 'Followers' : 'Following'}
      </h2>

      <div className="space-y-2">
        {list.map((user) => {
          const state = followStates[user.id] || (user.isFollowing ? 'following' : 'follow');
          return (
            <Card key={user.id} className="p-4">
              <div className="flex items-center gap-3">
                <Link to={`/home/profile/${encodeURIComponent(user.username)}`}>
                  <Avatar>
                    <AvatarImage src={user.avatar_url ?? undefined} />
                    <AvatarFallback>{user.username[0].toUpperCase()}</AvatarFallback>
                  </Avatar>
                </Link>
                <div className="flex-1 min-w-0">
                  <Link to={`/home/profile/${encodeURIComponent(user.username)}`}>
                    <h3 className="font-semibold hover:underline">{user.display_name}</h3>
                    <p className="text-sm text-muted-foreground">@{user.username}</p>
                  </Link>
                </div>
                <Button 
                  size="sm" 
                  variant={state === 'following' ? 'outline' : 'default'}
                  className={state === 'follow' ? 'bg-[#d6955b] hover:bg-[#c58549]' : ''}
                  onClick={() => handleFollowToggle(user.id, !!user.is_private)}
                >
                  {state === 'requested' ? 'Requested' : state === 'following' ? 'Unfollow' : 'Follow'}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
