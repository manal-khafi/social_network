import { useEffect, useRef } from "react";
import { toast } from "sonner";
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
import { isLocationContent, receiveMessage } from "../features/messages/messagesSlice";

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
        toast(`${p.user.username} reacted ${p.emoji}`);
      }
    };

    const onStoryNew = (p: any) => {
      if (p?.user_id && p.user_id !== currentUserId) scheduleFeedRefresh();
    };

    const onStoryReply = (p: any) => {
      const who = p?.sender?.username ? `@${p.sender.username}` : "Someone";
      toast(`${who} replied to your story`);
    };

    const onStoryPoll = (p: any) => {
      // Bridged to the story viewer via a DOM event (poll state is local there).
      window.dispatchEvent(new CustomEvent("story:poll", { detail: p }));
    };

    const onStoryQuestion = (p: any) => {
      const who = p?.user?.username ? `@${p.user.username}` : "Someone";
      toast(`${who} answered your question`);
    };

    const onMessage = (m: any) => {
      if (m?.conversation_id) dispatch(receiveMessage(m));
      const who = m?.sender?.username ? `@${m.sender.username}` : "New message";
      if (m?.message_type === "call") return; // call log; the call UI already handled it
      // Image / video / location messages carry a URL or coordinates as content;
      // don't toast it.
      const media =
        m?.message_type === "image"
          ? "a photo"
          : m?.message_type === "video"
          ? "a video"
          : isLocationContent(m?.content)
          ? "a location"
          : null;
      if (media) return void toast(`${who} sent you ${media}`);
      toast(m?.shared_story_id ? `${who} sent you a story` : `${who}: ${m?.content ?? ""}`);
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

    connectSocket();

    // Badge in the header / sidebar: start from the server's unread count.
    dispatch(fetchUnreadCount());

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
      if (feedRefreshTimer.current) window.clearTimeout(feedRefreshTimer.current);
    };
  }, [isAuthenticated, currentUserId, dispatch]);
}
