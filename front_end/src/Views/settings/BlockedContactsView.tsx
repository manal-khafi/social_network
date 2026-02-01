import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, UserX } from 'lucide-react';
import { Card } from '../../Components/ui/card';
import { Button } from '../../Components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '../../Components/ui/avatar';
import { toast } from 'sonner';
import * as blockApi from '../../api/blockApi';
import type { BlockedUser } from '../../api/blockApi';

export default function BlockedContactsView() {
  const navigate = useNavigate();
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [blockedCount, setBlockedCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // Load blocked users
  useEffect(() => {
    const loadBlockedUsers = async () => {
      try {
        setIsLoading(true);
        const [usersData, countData] = await Promise.all([
          blockApi.getBlockedUsers(1, 20),
          blockApi.getBlockedCount()
        ]);
        
        setBlockedUsers(usersData.users);
        setBlockedCount(countData.count);
        setHasMore(usersData.hasMore);
        setPage(usersData.page);
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Failed to load blocked users');
      } finally {
        setIsLoading(false);
      }
    };

    loadBlockedUsers();
  }, []);

  const loadMore = async () => {
    if (!hasMore || loadingMore) return;
    
    try {
      setLoadingMore(true);
      const usersData = await blockApi.getBlockedUsers(page + 1, 20);
      setBlockedUsers(prev => [...prev, ...usersData.users]);
      setHasMore(usersData.hasMore);
      setPage(usersData.page);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load more users');
    } finally {
      setLoadingMore(false);
    }
  };

  const handleUnblock = async (userId: string, username: string) => {
    try {
      await blockApi.unblockUser(userId);
      setBlockedUsers(prev => prev.filter(user => user.id !== userId));
      setBlockedCount(prev => prev - 1);
      toast.success(`Unblocked @${username}`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to unblock user');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading blocked users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center gap-3 z-10">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-muted rounded-full">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold">Blocked Contacts</h1>
      </div>

      <div className="p-4 space-y-4 max-w-2xl mx-auto pb-24">
        {/* Blocked Accounts */}
        <Card className="p-6 space-y-4">
          <h2 className="font-semibold flex items-center gap-2">
            <UserX className="w-5 h-5" />
            Blocked Accounts
            {blockedCount > 0 && (
              <span className="ml-auto text-sm text-muted-foreground">
                {blockedCount}
              </span>
            )}
          </h2>

          {blockedUsers.length === 0 ? (
            <div className="text-center py-8">
              <UserX className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No blocked accounts</p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {blockedUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-3 hover:bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={user.avatar_url ?? undefined} />
                        <AvatarFallback>{(user.username?.[0] ?? '?').toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{user.display_name}</p>
                        <p className="text-sm text-muted-foreground">@{user.username}</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUnblock(user.id, user.username)}
                    >
                      Unblock
                    </Button>
                  </div>
                ))}
              </div>
              
              {hasMore && (
                <div className="text-center pt-4">
                  <Button
                    variant="outline"
                    onClick={loadMore}
                    disabled={loadingMore}
                  >
                    {loadingMore ? 'Loading...' : 'Load More'}
                  </Button>
                </div>
              )}
            </>
          )}
        </Card>
      </div>
    </div>
  );
}