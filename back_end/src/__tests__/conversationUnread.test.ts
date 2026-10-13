import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";

// --- Mocks -----------------------------------------------------------------
const prismaMock = vi.hoisted(() => ({
  user: { findUnique: vi.fn() },
  conversationParticipant: { findMany: vi.fn(), findUnique: vi.fn() },
  message: { findFirst: vi.fn() },
}));
vi.mock("../config/prismaClient", () => ({ default: prismaMock }));

import app from "../app";
import { generateAccessToken } from "../util/jwt";

// ---------------------------------------------------------------------------

const token = generateAccessToken({
  id: "user-1",
  email: "alice@example.com",
  username: "alice",
  permissions: [],
  onboarding_done: true,
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/conversations/unread-count", () => {
  it("requires authentication", async () => {
    const res = await request(app).get("/api/conversations/unread-count");
    expect(res.status).toBe(401);
  });

  it("counts the conversations with a message newer than last_read_at", async () => {
    const readAt = new Date("2026-01-01T00:00:00Z");
    prismaMock.conversationParticipant.findMany.mockResolvedValue([
      { conversation_id: "conv-unread", last_read_at: readAt },
      { conversation_id: "conv-read", last_read_at: readAt },
      { conversation_id: "conv-never-opened", last_read_at: null },
    ]);
    prismaMock.message.findFirst.mockImplementation(async ({ where }: any) =>
      where.conversation_id === "conv-read" ? null : { id: "m1" }
    );

    const res = await request(app)
      .get("/api/conversations/unread-count")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      count: 2,
      conversation_ids: ["conv-unread", "conv-never-opened"],
    });

    // Not swallowed by GET /conversations/:id
    expect(prismaMock.conversationParticipant.findUnique).not.toHaveBeenCalled();

    // Archived chats are excluded; only other people's messages after the read mark count.
    expect(prismaMock.conversationParticipant.findMany.mock.calls[0][0].where).toEqual({
      user_id: "user-1",
      is_archived: false,
    });
    const where = prismaMock.message.findFirst.mock.calls[0][0].where;
    expect(where.sender_id).toEqual({ not: "user-1" });
    expect(where.created_at).toEqual({ gt: readAt });
  });
});
