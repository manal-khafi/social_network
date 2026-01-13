import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../hooks';
import { followUser, unfollowUser } from '../../features/user/userSlice';
import { Card } from '../../Componenets/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '../../Componenets/ui/avatar';
import { Button } from '../../Componenets/ui/button';
import { toast } from 'sonner';

interface FollowersViewProps {
  type: 'followers' | 'following';
}

export default function FollowersView({ type }: FollowersViewProps) {
  const dispatch = useAppDispatch();
  const { suggestedUsers, currentUser } = useAppSelector((state) => state.user);
  const [followStates, setFollowStates] = useState<{ [key: string]: 'follow' | 'following' | 'requested' }>({});

  const handleFollowToggle = (userId: string, isPublic: boolean) => {
    const currentState = followStates[userId] || 'follow';
    
    if (currentState === 'follow') {
      dispatch(followUser(userId));
      if (isPublic) {
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
        {suggestedUsers.map((user) => {
          const state = followStates[user.id] || 'follow';
          return (
            <Card key={user.id} className="p-4">
              <div className="flex items-center gap-3">
                <Link to={`/profile/${user.id}`}>
                  <Avatar>
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback>{user.username[0].toUpperCase()}</AvatarFallback>
                  </Avatar>
                </Link>
                <div className="flex-1 min-w-0">
                  <Link to={`/profile/${user.id}`}>
                    <h3 className="font-semibold hover:underline">{user.fullName}</h3>
                    <p className="text-sm text-muted-foreground">@{user.username}</p>
                  </Link>
                </div>
                <Button 
                  size="sm" 
                  variant={state === 'following' ? 'outline' : 'default'}
                  className={state === 'follow' ? 'bg-[#d6955b] hover:bg-[#c58549]' : ''}
                  onClick={() => handleFollowToggle(user.id, user.isPublic)}
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