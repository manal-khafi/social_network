import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "../../hooks";
import {
  archiveConversation,
  unarchiveConversation,
  deleteConversation,
  fetchConversations,
  fetchArchivedConversations,
  isSeenBy,
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
  Check,
  CheckCheck,
} from "lucide-react";
import NewMessageDialog from "./NewMessageDialog";
import { useTranslation } from "react-i18next";

function ConversationRow({
  conv,
  archived,
}: {
  conv: Conversation;
  archived: boolean;
}) {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
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
          <span className="absolute bottom-0.5 end-0.5 w-3.5 h-3.5 rounded-full bg-green-500 border-2 border-background" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className={`truncate ${unread ? "font-semibold" : "font-medium"}`}>
            {conv.username}
          </span>
          <span className="ms-auto shrink-0 text-[11px] text-muted-foreground">
            {conv.timestamp}
          </span>
        </div>
        <p
          className={`flex items-center gap-1 text-sm ${
            unread ? "text-foreground" : "text-muted-foreground"
          }`}
        >
          {conv.lastMessageFromMe &&
            conv.lastMessage &&
            (isSeenBy(conv.otherLastReadAt, conv.lastMessageAt) ? (
              <CheckCheck className="w-4 h-4 shrink-0 text-primary" aria-label={t("messages.seen")} />
            ) : (
              <Check className="w-4 h-4 shrink-0" aria-label={t("messages.sent")} />
            ))}
          <span className="truncate">{conv.lastMessage || t("messages.noMessages")}</span>
        </p>
      </div>

      {unread && (
        <span
          className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-semibold text-primary-foreground"
          aria-label={t("messages.unreadCount", { count: conv.unreadCount })}
        >
          {conv.unreadCount > 9 ? "9+" : conv.unreadCount}
        </span>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
          <button
            className="p-2 rounded-full hover:bg-muted opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
            aria-label={t("messages.conversationOptions")}
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
              <ArchiveRestore className="w-4 h-4 me-2" />
              {t("messages.unarchive")}
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              onClick={(e) => {
                e.preventDefault();
                dispatch(archiveConversation(conv.id));
              }}
            >
              <Archive className="w-4 h-4 me-2" />
              {t("messages.archive")}
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            className="text-destructive"
            onClick={(e) => {
              e.preventDefault();
              if (confirm(t("messages.deleteConfirm"))) {
                dispatch(deleteConversation(conv.id));
              }
            }}
          >
            <Trash2 className="w-4 h-4 me-2" />
            {t("messages.deleteConversation")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </Link>
  );
}

export default function InboxView() {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
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
              className="flex items-center gap-2 -ms-2 p-2 rounded-lg hover:bg-muted"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-xl font-bold">{t("messages.archived")}</span>
            </button>
          ) : (
            <h1 className="text-xl font-bold">{t("messages.title")}</h1>
          )}

          {!showArchived && (
            <button
              onClick={() => setComposeOpen(true)}
              className="p-2 rounded-full hover:bg-muted"
              aria-label={t("messages.newMessage")}
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
              placeholder={showArchived ? t("messages.searchArchived") : t("messages.searchMessages")}
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
            <span className="font-medium flex-1 text-start">{t("messages.archived")}</span>
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
                ? t("messages.noMatches")
                : showArchived
                ? t("messages.noArchivedChats")
                : t("messages.noMessages")}
            </p>
            {!query && !showArchived && (
              <>
                <p className="text-sm text-muted-foreground">
                  {t("messages.startConversation")}
                </p>
                <button
                  onClick={() => setComposeOpen(true)}
                  className="mt-2 rounded-full bg-primary text-primary-foreground text-sm font-semibold px-4 py-2"
                >
                  {t("messages.newMessage")}
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
