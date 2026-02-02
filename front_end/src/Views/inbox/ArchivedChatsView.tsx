import { Link } from 'react-router-dom';
import { useEffect } from 'react';
import { useAppSelector } from '../../hooks';
import { useAppDispatch } from '../../hooks';
import { fetchConversations, unarchiveConversation } from '../../features/messages/messagesSlice';
import { Card } from '../../Components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '../../Components/ui/avatar';
import { Archive } from 'lucide-react';

export default function ArchivedChatsView() {
  const dispatch = useAppDispatch();
  const { conversations } = useAppSelector((state) => state.messages);
  const archivedChats = conversations.filter(c => c.isArchived);

  useEffect(() => {
    dispatch(fetchConversations({ archived: true }));
  }, [dispatch]);

  const handleRestore = (e: React.MouseEvent, conversationId: string) => {
    e.preventDefault();
    dispatch(unarchiveConversation(conversationId));
  };

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto pb-24">
      <div className="flex items-center gap-3 mb-4">
        <Archive className="w-6 h-6" />
        <h1 className="text-2xl font-bold">Archived Chats</h1>
      </div>

      {archivedChats.length === 0 ? (
        <Card className="p-8 text-center">
          <Archive className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
          <p className="text-muted-foreground">No archived chats</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {archivedChats.map((conversation) => (
            <Link key={conversation.id} to={`/home/inbox/${conversation.id}`}>
              <Card className="p-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={conversation.avatar} />
                    <AvatarFallback>{conversation.username[0].toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold">{conversation.username}</p>
                      <span className="text-xs text-muted-foreground">{conversation.timestamp}</span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{conversation.lastMessage}</p>
                  </div>
                  <button
                    className="px-3 py-1.5 rounded-lg text-sm bg-[#ECF8F6] text-[#18534F] hover:bg-[#dff3f1]"
                    onClick={(e) => handleRestore(e, conversation.id)}
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
  );
}
