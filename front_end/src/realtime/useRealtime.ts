import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "../hooks";
import { connectSocket, disconnectSocket, getSocket } from "./socket";
import {
  applyRemoteStoryStat,
  fetchStories,
} from "../features/stories/storiesSlice";
import { addNotification } from "../features/notifications/notificationsSlice";

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

    const onNotification = (n: any) => {
      const actorId =
        n?.metadata?.actor_id ??
        n?.metadata?.viewer_id ??
        n?.metadata?.sender_id ??
        n?.metadata?.liker_id ??
        n?.metadata?.commenter_id ??
        "";
      dispatch(
        addNotification({
          type: "like",
          userId: String(actorId),
          username: "",
          content: n?.message ?? n?.title ?? "New activity",
          postId: n?.source_type === "story" ? undefined : n?.source_id,
        } as any)
      );
      if (n?.message) toast(n.message);
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

    const onMessage = (m: any) => {
      const who = m?.sender?.username ? `@${m.sender.username}` : "New message";
      toast(m?.shared_story_id ? `${who} sent you a story` : `${who}: ${m?.content ?? ""}`);
    };

    socket.on("notification:new", onNotification);
    socket.on("story:view", onStoryView);
    socket.on("story:reaction", onStoryReaction);
    socket.on("story:new", onStoryNew);
    socket.on("story:reply", onStoryReply);
    socket.on("message:new", onMessage);

    connectSocket();

    return () => {
      socket.off("notification:new", onNotification);
      socket.off("story:view", onStoryView);
      socket.off("story:reaction", onStoryReaction);
      socket.off("story:new", onStoryNew);
      socket.off("story:reply", onStoryReply);
      socket.off("message:new", onMessage);
      if (feedRefreshTimer.current) window.clearTimeout(feedRefreshTimer.current);
    };
  }, [isAuthenticated, currentUserId, dispatch]);
}
