import { useEffect, useRef } from "react";
import { toast } from "sonner";
import i18n from "../i18n/i18n";
import { useAppDispatch, useAppSelector } from "../hooks";
import { connectSocket, disconnectSocket, getSocket } from "./socket";
import {
  applyRemoteStoryStat,
  fetchStories,
} from "../features/stories/storiesSlice";
import {
  fetchUnreadCount,
  notificationReceived,
  notificationsRemoved,
} from "../features/notifications/notificationsSlice";
import type { Notification } from "../features/notifications/notificationsSlice";
import {
  conversationRead,
  fetchUnreadConversationCount,
  isLocationContent,
  receiveMessage,
} from "../features/messages/messagesSlice";

/**
 * Opens the realtime connection while the user is authenticated and routes
 * server events into the Redux store. Mount once, near the app root.
 */
export function useRealtime() {
  const dispatch = useAppDispatch();
  // authSlice keeps isAuthenticated === Boolean(token); the socket re-reads the
  // freshest token on every (re)connect via its `auth` callback, so we only need
  // to react to the auth state flipping, not to every token rotation.
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  const currentUserId = useAppSelector((s) => s.user.currentUser?.id);
  const feedRefreshTimer = useRef<number | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      disconnectSocket();
      return;
    }

    const socket = getSocket();

    const scheduleFeedRefresh = () => {
      if (feedRefreshTimer.current) window.clearTimeout(feedRefreshTimer.current);
      feedRefreshTimer.current = window.setTimeout(() => {
        dispatch(fetchStories());
      }, 800);
    };

    // Live notification (same payload shape as GET /notifications).
    const onNotification = (n: Notification) => {
      if (!n?.id) return;
      dispatch(notificationReceived(n));
      if (n.message) toast(n.message);
    };

    // The action behind a notification was undone (unlike, unfollow, ...).
    const onNotificationRemoved = (p: { ids?: string[]; count?: number }) => {
      if (Array.isArray(p?.ids)) dispatch(notificationsRemoved({ ids: p.ids, count: p.count }));
    };

    const onStoryView = (p: any) => {
      dispatch(applyRemoteStoryStat({ storyId: p.story_id, views: p.view_count }));
    };

    const onStoryReaction = (p: any) => {
      dispatch(
        applyRemoteStoryStat({ storyId: p.story_id, reactions: p.reaction_count })
      );
      if (p?.user?.username && p?.emoji) {
        toast(i18n.t("stories.reacted", { username: p.user.username, emoji: p.emoji }));
      }
    };

    const onStoryNew = (p: any) => {
      if (p?.user_id && p.user_id !== currentUserId) scheduleFeedRefresh();
    };

    const onStoryReply = (p: any) => {
      const who = p?.sender?.username ? `@${p.sender.username}` : i18n.t("stories.someone");
      toast(i18n.t("stories.repliedToYourStory", { who }));
    };

    const onStoryPoll = (p: any) => {
      // Bridged to the story viewer via a DOM event (poll state is local there).
      window.dispatchEvent(new CustomEvent("story:poll", { detail: p }));
    };

    const onStoryQuestion = (p: any) => {
      const who = p?.user?.username ? `@${p.user.username}` : i18n.t("stories.someone");
      toast(i18n.t("stories.answeredYourQuestion", { who }));
    };

    const onMessage = (m: any) => {
      if (m?.conversation_id) dispatch(receiveMessage(m));
      const who = m?.sender?.username ? `@${m.sender.username}` : i18n.t("messages.newMessageFrom");
      if (m?.message_type === "call") return; // call log; the call UI already handled it
      // Image / video / location messages carry a URL or coordinates as content;
      // don't toast it.
      const media =
        m?.message_type === "image"
          ? "messages.sentYouAPhoto"
          : m?.message_type === "video"
          ? "messages.sentYouAVideo"
          : isLocationContent(m?.content)
          ? "messages.sentYouALocation"
          : null;
      if (media) return void toast(`${who} ${i18n.t(media)}`);
      toast(m?.shared_story_id ? i18n.t("stories.sentYouAStory", { who }) : `${who}: ${m?.content ?? ""}`);
    };

    // Read receipt: moves the "Seen" indicator in the chat and the inbox ticks.
    const onConversationRead = (r: any) => {
      if (r?.conversationId && r?.last_read_at) dispatch(conversationRead(r));
    };

    socket.on("new_notification", onNotification);
    socket.on("notification_removed", onNotificationRemoved);
    socket.on("story:view", onStoryView);
    socket.on("story:reaction", onStoryReaction);
    socket.on("story:new", onStoryNew);
    socket.on("story:reply", onStoryReply);
    socket.on("story:poll", onStoryPoll);
    socket.on("story:question", onStoryQuestion);
    socket.on("message:new", onMessage);
    socket.on("conversation:read", onConversationRead);

    connectSocket();

    // Badges in the header / sidebar / bottom nav: start from the server's
    // unread counts.
    dispatch(fetchUnreadCount());
    dispatch(fetchUnreadConversationCount());

    return () => {
      socket.off("new_notification", onNotification);
      socket.off("notification_removed", onNotificationRemoved);
      socket.off("story:view", onStoryView);
      socket.off("story:reaction", onStoryReaction);
      socket.off("story:new", onStoryNew);
      socket.off("story:reply", onStoryReply);
      socket.off("story:poll", onStoryPoll);
      socket.off("story:question", onStoryQuestion);
      socket.off("message:new", onMessage);
      socket.off("conversation:read", onConversationRead);
      if (feedRefreshTimer.current) window.clearTimeout(feedRefreshTimer.current);
    };
  }, [isAuthenticated, currentUserId, dispatch]);
}
