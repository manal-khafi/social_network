import { useAppSelector, useAppDispatch } from '../../hooks';
import { joinCommunity, leaveCommunity } from '../../features/communities/communitiesSlice';
import { Button } from '../../Componenets/ui/button';
import { Card } from '../../Componenets/ui/card';
import { Users } from 'lucide-react';

export default function CommunityView() {
  const { trending, suggested } = useAppSelector((state) => state.communities);
  const dispatch = useAppDispatch();

  return (
    <div className="p-4 space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4">Trending Communities</h2>
        <div className="space-y-3">
          {trending.map((community) => (
            <Card key={community.id} className="p-4">
              <div className="flex items-start gap-3">
                {community.image && (
                  <img
                    src={community.image}
                    alt={community.name}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold">{community.name}</h3>
                  <p className="text-sm text-muted-foreground">{community.description}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {community.membersCount.toLocaleString()} members
                    </span>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant={community.isJoined ? "outline" : "default"}
                  onClick={() =>
                    community.isJoined
                      ? dispatch(leaveCommunity(community.id))
                      : dispatch(joinCommunity(community.id))
                  }
                  className={!community.isJoined ? 'bg-[#d6955b] hover:bg-[#c58549]' : ''}
                >
                  {community.isJoined ? 'Joined' : 'Join'}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
