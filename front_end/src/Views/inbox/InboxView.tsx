import { Link } from 'react-router-dom';
import { useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '../../hooks';
import {
  archiveConversation,
  connectInboxRealtime,
  deleteConversation,
  fetchConversations,
  subscribePresence,
  unarchiveConversation,
} from '../../features/messages/messagesSlice';
import { Card } from '../../Components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '../../Components/ui/avatar';
import { Badge } from '../../Components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../Components/ui/dropdown-menu';
import { Archive, MoreVertical, Trash2 } from 'lucide-react';

export default function InboxView() {
  const dispatch = useAppDispatch();
  const { conversations, status, error } = useAppSelector((state) => state.messages);

  const activeConversations = conversations.filter((c) => !c.isArchived);
  const archivedConversations = conversations.filter((c) => c.isArchived);

  useEffect(() => {
    dispatch(connectInboxRealtime());
    dispatch(fetchConversations({ archived: false })).then((action: any) => {
      const convs = action?.payload?.conversations ?? [];
      const ids = convs.map((c: any) => c.otherUser?.id).filter(Boolean);
      if (ids.length > 0) dispatch(subscribePresence({ userIds: ids }));
    });

    // Fetch archived conversations too, so Inbox can show a dedicated section.
    dispatch(fetchConversations({ archived: true })).then((action: any) => {
      const convs = action?.payload?.conversations ?? [];
      const ids = convs.map((c: any) => c.otherUser?.id).filter(Boolean);
      if (ids.length > 0) dispatch(subscribePresence({ userIds: ids }));
    });
  }, [dispatch]);

  const handleArchive = (e: React.MouseEvent, convId: string) => {
    e.preventDefault();
    dispatch(archiveConversation(convId));
  };

  const handleDelete = (e: React.MouseEvent, convId: string) => {
    e.preventDefault();
    if (confirm('Delete this conversation?')) {
      dispatch(deleteConversation(convId));
    }
  };

  const handleRestore = (e: React.MouseEvent, convId: string) => {
    e.preventDefault();
    dispatch(unarchiveConversation(convId));
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Messages</h2>
        <Link
          to="/home/inbox/archived"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Chats archivés ({archivedConversations.length})
        </Link>
      </div>

      {status === "loading" && (
        <Card className="p-4 text-muted-foreground">Loading conversations…</Card>
      )}

      {status === "failed" && (
        <Card className="p-4">
          <p className="font-medium mb-1">Failed to load conversations</p>
          <p className="text-sm text-muted-foreground mb-3">{error || "Unknown error"}</p>
          <button
            className="px-3 py-2 rounded bg-primary text-primary-foreground"
            onClick={() => dispatch(fetchConversations({ archived: false }))}
          >
            Retry
          </button>
        </Card>
      )}

      {status === "succeeded" && activeConversations.length === 0 && (
        <Card className="p-4 text-muted-foreground">
          No conversations yet. Open a profile and click Message, or start from Search.
        </Card>
      )}

      <div className="space-y-3">
        {activeConversations.map((conv) => (
          <Link key={conv.id} to={`/home/inbox/${conv.id}`}>
            <Card className="p-4 hover:bg-muted/50 transition-colors cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Avatar>
                    <AvatarImage src={conv.avatar} />
                    <AvatarFallback>{(conv.username?.[0] ?? "?").toUpperCase()}</AvatarFallback>
                  </Avatar>
                  {/* Online/Offline indicator */}
                  <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-card ${
                    conv.isOnline ? 'bg-green-500' : 'bg-gray-400'
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold">{conv.username}</h3>
                    <span className="text-xs text-muted-foreground">{conv.timestamp}</span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {conv.lastMessage}
                    {!conv.isOnline && conv.lastSeen && (
                      <span className="ml-2 text-xs">• Active {conv.lastSeen}</span>
                    )}
                  </p>
                </div>
                {conv.unreadCount > 0 && (
                  <Badge className="bg-primary">{conv.unreadCount}</Badge>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
                    <button className="p-2 hover:bg-muted rounded-full">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={(e) => handleArchive(e, conv.id)}>
                      <Archive className="w-4 h-4 mr-2" />
                      Archive
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={(e) => handleDelete(e, conv.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      <div className="pt-2">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-muted-foreground">Chats archivés</h3>
          <Link to="/home/inbox/archived" className="text-sm text-muted-foreground hover:text-foreground">
            Voir tout
          </Link>
        </div>

        {archivedConversations.length === 0 ? (
          <Card className="p-4 text-muted-foreground">Aucun chat archivé.</Card>
        ) : (
          <div className="space-y-3">
            {archivedConversations.slice(0, 5).map((conv) => (
              <Link key={conv.id} to={`/home/inbox/${conv.id}`}>
                <Card className="p-4 hover:bg-muted/50 transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={conv.avatar} />
                      <AvatarFallback>{(conv.username?.[0] ?? "?").toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold">{conv.username}</h3>
                        <span className="text-xs text-muted-foreground">{conv.timestamp}</span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{conv.lastMessage}</p>
                    </div>

                    <button
                      className="px-3 py-1.5 rounded-lg text-sm bg-[#ECF8F6] text-[#18534F] hover:bg-[#dff3f1]"
                      onClick={(e) => handleRestore(e, conv.id)}
                    >
                      Restaurer
                    </button>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
