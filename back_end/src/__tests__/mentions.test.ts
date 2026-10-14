import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import { parseMentions } from "../util/mentions";

// --- Mocks -----------------------------------------------------------------
const prismaMock = vi.hoisted(() => ({
  user: { findUnique: vi.fn(), findMany: vi.fn() },
  post: { findFirst: vi.fn() },
  story: { findUnique: vi.fn() },
  typeNotification: { upsert: vi.fn() },
  notification: { create: vi.fn(), findFirst: vi.fn() },
}));
vi.mock("../config/prismaClient", () => ({ default: prismaMock }));
vi.mock("../services/BlockService", () => ({ getBlockedUserIds: vi.fn(async () => []) }));
const canViewStory = vi.hoisted(() => vi.fn());
vi.mock("../services/relationship.service", () => ({ RelationshipService: { canViewStory } }));
const sendStoryMention = vi.hoisted(() => vi.fn());
vi.mock("../services/conversation.service", () => ({ ConversationService: { sendStoryMention } }));
const ioMock = vi.hoisted(() => ({ emitToUser: vi.fn(), emitToUsers: vi.fn() }));
vi.mock("../realtime/io", () => ioMock);

import app from "../app";
import { StoryService } from "../services/story.service";
import { NotificationService } from "../services/notificationService";

// ---------------------------------------------------------------------------

const flush = () => new Promise((r) => setTimeout(r, 20));

beforeEach(() => {
  vi.clearAllMocks();
  prismaMock.typeNotification.upsert.mockResolvedValue({ id: "type-mention" });
  prismaMock.notification.create.mockImplementation(async ({ data }: any) => ({
    ...data,
    id: "n1",
    is_read: false,
    created_at: new Date(),
    typeNotification: { code: "mention" },
  }));
});

describe("parseMentions", () => {
  it("finds @usernames but not e-mail addresses, and drops a trailing dot", () => {
    expect(parseMentions("hi @bob and @alice.smith. mail me@site.com @bob")).toEqual(["bob", "alice.smith"]);
  });
});

describe("story mentions", () => {
  it("collects mention stickers, text stickers and the caption", () => {
    const names = StoryService.storyMentions({
      content_type: "image",
      content_url: "https://x/img.jpg",
      caption: "with @carol",
      overlays: [
        { id: "1", type: "mention", text: "bob" },
        { id: "2", type: "text", text: "hey @dave!" },
      ],
    });
    expect(names.sort()).toEqual(["bob", "carol", "dave"]);
  });

  it("notifies and DMs mentioned users who can see the story, and skips the others", async () => {
    prismaMock.story.findUnique.mockResolvedValue({ visibility: "close_friends" });
    prismaMock.user.findMany.mockResolvedValue([
      { id: "bob-id", username: "bob" },
      { id: "carol-id", username: "carol" },
    ]);
    canViewStory.mockImplementation(async (viewerId: string) => viewerId === "bob-id");
    prismaMock.user.findUnique.mockImplementation(async ({ where }: any) =>
      where.id === "alice-id" ? { username: "alice", display_name: "Alice" } : { allow_mention_notifications: true }
    );

    await (StoryService as any).notifyStoryMentions("alice-id", "story-1", {
      content_type: "text",
      content_url: "hi @bob @carol",
      overlays: [],
    });

    expect(sendStoryMention).toHaveBeenCalledTimes(1);
    expect(sendStoryMention).toHaveBeenCalledWith("alice-id", "bob-id", "story-1");
    const created = prismaMock.notification.create.mock.calls.map((c: any) => c[0].data);
    expect(created).toHaveLength(1);
    expect(created[0]).toMatchObject({
      user_id: "bob-id",
      source_id: "story-1",
      source_type: "story",
      message: "@alice mentioned you in their story",
    });
  });
});

describe("post mentions", () => {
  it("notifies mentioned users with a post message", async () => {
    prismaMock.user.findMany.mockResolvedValue([{ id: "bob-id", username: "bob" }]);
    prismaMock.user.findUnique.mockImplementation(async ({ where }: any) =>
      where.id === "alice-id" ? { username: "alice", display_name: "Alice" } : { allow_mention_notifications: true }
    );

    NotificationService.notifyPostMentions({ actorId: "alice-id", content: "look @bob", postId: "post-1" });
    await flush();

    const data = prismaMock.notification.create.mock.calls[0][0].data;
    expect(data).toMatchObject({ user_id: "bob-id", source_id: "post-1", message: "@alice mentioned you in a post" });
  });
});

describe("GET /api/posts/:postId", () => {
  it("returns one post", async () => {
    prismaMock.post.findFirst.mockResolvedValue({
      id: "11111111-1111-1111-1111-111111111111",
      user_id: "u1",
      user: { username: "bob", allow_comments: true },
      content: "hello",
      media_urls: null,
      visibility: "public",
      is_archived: false,
      created_at: new Date("2026-01-01"),
      updated_at: new Date("2026-01-01"),
      _count: { likes: 2, comments: 1, shares: 0, saves: 0, reposts: 0 },
    });
    const res = await request(app).get("/api/posts/11111111-1111-1111-1111-111111111111");
    expect(res.status).toBe(200);
    expect(res.body.post).toMatchObject({ id: "11111111-1111-1111-1111-111111111111", username: "bob", likes: 2 });
  });

  it("does not capture the other /api/posts routes", async () => {
    const res = await request(app).get("/api/posts/mylikes");
    expect(prismaMock.post.findFirst).not.toHaveBeenCalled();
    expect(res.status).toBe(401); // reaches MyLikedPosts, which requires auth
  });
});
