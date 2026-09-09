import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "../../hooks";
import {
  archiveConversation,
  unarchiveConversation,
  deleteConversation,
  fetchConversations,
  fetchArchivedConversations,
} from "../../features/messages/messagesSlice";
import type { Conversation } from "../../features/messages/messagesSlice";
import { Avatar, AvatarImage, AvatarFallback } from "../../Components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../Components/ui/dropdown-menu";
import {
  Archive,
  ArchiveRestore,
  MoreVertical,
  Trash2,
  Search,
  SquarePen,
  MessageSquare,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";
import NewMessageDialog from "./NewMessageDialog";

function ConversationRow({
  conv,
  archived,
}: {
  conv: Conversation;
  archived: boolean;
}) {
  const dispatch = useAppDispatch();
  const unread = conv.unreadCount > 0;

  return (
    <Link
      to={`/home/inbox/${conv.id}`}
      className="group flex items-center gap-3 px-4 py-3 hover:bg-muted/60 transition-colors"
    >
      <div className="relative shrink-0">
        <Avatar className="w-14 h-14">
          <AvatarImage src={conv.avatar} />
          <AvatarFallback>{conv.username[0]?.toUpperCase()}</AvatarFallback>
        </Avatar>
        {conv.isOnline && (
          <span className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-green-500 border-2 border-background" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className={`truncate ${unread ? "font-semibold" : "font-medium"}`}>
            {conv.username}
          </span>
          <span className="ml-auto shrink-0 text-[11px] text-muted-foreground">
            {conv.timestamp}
          </span>
        </div>
        <p
          className={`truncate text-sm ${
            unread ? "text-foreground" : "text-muted-foreground"
          }`}
        >
          {conv.lastMessage || "No messages yet"}
        </p>
      </div>

      {unread && <span className="w-2.5 h-2.5 rounded-full bg-primary shrink-0" />}

      <DropdownMenu>
        <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
          <button
            className="p-2 rounded-full hover:bg-muted opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
            aria-label="Conversation options"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {archived ? (
            <DropdownMenuItem
              onClick={(e) => {
                e.preventDefault();
                dispatch(unarchiveConversation(conv.id));
              }}
            >
              <ArchiveRestore className="w-4 h-4 mr-2" />
              Unarchive
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              onClick={(e) => {
                e.preventDefault();
                dispatch(archiveConversation(conv.id));
              }}
            >
              <Archive className="w-4 h-4 mr-2" />
              Archive
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            className="text-destructive"
            onClick={(e) => {
              e.preventDefault();
              if (confirm("Delete this conversation?")) {
                dispatch(deleteConversation(conv.id));
              }
            }}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </Link>
  );
}

export default function InboxView() {
  const dispatch = useAppDispatch();
  const { conversations, archivedConversations, status } = useAppSelector(
    (state) => state.messages
  );
  const [query, setQuery] = useState("");
  const [composeOpen, setComposeOpen] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  useEffect(() => {
    dispatch(fetchConversations());
    dispatch(fetchArchivedConversations());
  }, [dispatch]);

  const source = showArchived ? archivedConversations : conversations;

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return source.filter(
      (c) =>
        !q ||
        c.username.toLowerCase().includes(q) ||
        c.lastMessage.toLowerCase().includes(q)
    );
  }, [source, query]);

  const loading = status === "loading" && conversations.length === 0;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          {showArchived ? (
            <button
              onClick={() => setShowArchived(false)}
              className="flex items-center gap-2 -ml-2 p-2 rounded-lg hover:bg-muted"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-xl font-bold">Archived</span>
            </button>
          ) : (
            <h1 className="text-xl font-bold">Messages</h1>
          )}

          {!showArchived && (
            <button
              onClick={() => setComposeOpen(true)}
              className="p-2 rounded-full hover:bg-muted"
              aria-label="New message"
            >
              <SquarePen className="w-5 h-5" />
            </button>
          )}
        </div>
        <div className="px-4 pb-3">
          <div className="flex items-center gap-2 rounded-full bg-muted px-3 py-2">
            <Search className="w-4 h-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={showArchived ? "Search archived" : "Search messages"}
              className="flex-1 bg-transparent text-sm outline-none"
            />
          </div>
        </div>
      </div>

      {/* List */}
      <div className="py-1">
        {/* Archived pinned row (WhatsApp style) */}
        {!showArchived && archivedConversations.length > 0 && !query && (
          <button
            onClick={() => setShowArchived(true)}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/60 transition-colors border-b border-border/60"
          >
            <span className="w-14 h-14 rounded-full bg-muted grid place-items-center shrink-0">
              <Archive className="w-6 h-6 text-muted-foreground" />
            </span>
            <span className="font-medium flex-1 text-left">Archived</span>
            <span className="text-sm text-muted-foreground">{archivedConversations.length}</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        )}

        {loading &&
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3">
              <div className="w-14 h-14 rounded-full bg-muted animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-32 rounded bg-muted animate-pulse" />
                <div className="h-3 w-48 rounded bg-muted animate-pulse" />
              </div>
            </div>
          ))}

        {!loading && list.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-20 text-center px-8">
            <div className="w-14 h-14 rounded-full bg-muted grid place-items-center">
              {showArchived ? (
                <Archive className="w-7 h-7 text-muted-foreground" />
              ) : (
                <MessageSquare className="w-7 h-7 text-muted-foreground" />
              )}
            </div>
            <p className="font-medium">
              {query
                ? "No matches"
                : showArchived
                ? "No archived chats"
                : "No messages yet"}
            </p>
            {!query && !showArchived && (
              <>
                <p className="text-sm text-muted-foreground">
                  Start a conversation with someone you follow.
                </p>
                <button
                  onClick={() => setComposeOpen(true)}
                  className="mt-2 rounded-full bg-primary text-primary-foreground text-sm font-semibold px-4 py-2"
                >
                  New message
                </button>
              </>
            )}
          </div>
        )}

        {list.map((conv) => (
          <ConversationRow key={conv.id} conv={conv} archived={showArchived} />
        ))}
      </div>

      <NewMessageDialog open={composeOpen} onOpenChange={setComposeOpen} />
    </div>
  );
}
