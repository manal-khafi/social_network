import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks';
import { fetchBlockedUsers, unblockUser } from '../../features/user/userSlice';
import { ArrowLeft, UserX } from 'lucide-react';
import { Card } from '../../Components/ui/card';
import { Button } from '../../Components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '../../Components/ui/avatar';
import { toast } from 'sonner';

export default function BlockedContactsView() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { blockedUsers, blockedCount } = useAppSelector((state) => state.user);

  useEffect(() => {
    dispatch(fetchBlockedUsers());
  }, [dispatch]);

  const handleUnblock = (userId: string, username: string) => {
    dispatch(unblockUser(userId));
    toast.success(`Unblocked @${username}`);
  };

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
            <p className="text-sm text-muted-foreground">No blocked accounts</p>
          ) : (
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
          )}
        </Card>
      </div>
    </div>
  );
}
