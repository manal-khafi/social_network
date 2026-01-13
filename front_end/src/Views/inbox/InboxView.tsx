import { Link } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../hooks';
import { archiveConversation, deleteConversation } from '../../features/messages/messagesSlice';
import { Card } from '../../Componenets/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '../../Componenets/ui/avatar';
import { Badge } from '../../Componenets/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../Componenets/ui/dropdown-menu';
import { Archive, MoreVertical, Trash2 } from 'lucide-react';

export default function InboxView() {
  const dispatch = useAppDispatch();
  const { conversations } = useAppSelector((state) => state.messages);

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

  return (
    <div className="p-4 space-y-2">
      <h2 className="text-xl font-semibold mb-4">Messages</h2>
      {conversations.filter(c => !c.isArchived).map((conv) => (
        <Link key={conv.id} to={`/inbox/${conv.id}`}>
          <Card className="p-4 hover:bg-muted/50 transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar>
                  <AvatarImage src={conv.avatar} />
                  <AvatarFallback>{conv.username[0].toUpperCase()}</AvatarFallback>
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
  );
}