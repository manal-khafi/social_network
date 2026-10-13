import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";

// --- Mocks -----------------------------------------------------------------
const prismaMock = vi.hoisted(() => ({
  user: { findUnique: vi.fn() },
  conversation: { findUnique: vi.fn() },
  conversationParticipant: { findMany: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
}));
vi.mock("../config/prismaClient", () => ({ default: prismaMock }));

const ioMock = vi.hoisted(() => ({ emitToUser: vi.fn(), emitToUsers: vi.fn() }));
vi.mock("../realtime/io", () => ioMock);

import app from "../app";
import { generateAccessToken } from "../util/jwt";

// ---------------------------------------------------------------------------

const auth = {
  Authorization: `Bearer ${generateAccessToken({
    id: "user-1",
    email: "alice@example.com",
    username: "alice",
    permissions: [],
    onboarding_done: true,
  })}`,
};

beforeEach(() => {
  vi.clearAllMocks();
  prismaMock.conversationParticipant.findUnique.mockResolvedValue({ id: "p1" });
  prismaMock.conversationParticipant.update.mockResolvedValue({});
  prismaMock.conversationParticipant.findMany.mockResolvedValue([{ user_id: "user-2" }]);
});

describe("POST /api/conversations/:id/read", () => {
  it("records the read position and sends a read receipt", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ allow_read_receipts: true });

    const res = await request(app).post("/api/conversations/conv-1/read").set(auth);

    expect(res.status).toBe(200);
    expect(prismaMock.conversationParticipant.update).toHaveBeenCalledTimes(1);
    expect(ioMock.emitToUser).toHaveBeenCalledWith(
      "user-2",
      "conversation:read",
      expect.objectContaining({ conversationId: "conv-1", userId: "user-1" })
    );
  });

  it("still records the read position but sends nothing when receipts are off", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ allow_read_receipts: false });

    const res = await request(app).post("/api/conversations/conv-1/read").set(auth);

    expect(res.status).toBe(200);
    expect(prismaMock.conversationParticipant.update).toHaveBeenCalledTimes(1);
    expect(ioMock.emitToUser).not.toHaveBeenCalled();
  });
});

describe("GET /api/conversations/:id", () => {
  const readAt = new Date("2026-01-01T00:00:00.000Z");
  const conversation = (allowReadReceipts: boolean) => ({
    id: "conv-1",
    is_group: false,
    last_message_at: readAt,
    participants: [
      { user_id: "user-1", last_read_at: null, user: { id: "user-1", allow_read_receipts: true } },
      {
        user_id: "user-2",
        last_read_at: readAt,
        user: { id: "user-2", username: "bob", allow_read_receipts: allowReadReceipts },
      },
    ],
  });

  it("exposes when the other participant read the chat", async () => {
    prismaMock.conversation.findUnique.mockResolvedValue(conversation(true));

    const res = await request(app).get("/api/conversations/conv-1").set(auth);

    expect(res.body.data.other_last_read_at).toBe(readAt.toISOString());
    expect(res.body.data.other_user).toEqual({ id: "user-2", username: "bob" });
  });

  it("hides it when they turned read receipts off", async () => {
    prismaMock.conversation.findUnique.mockResolvedValue(conversation(false));

    const res = await request(app).get("/api/conversations/conv-1").set(auth);

    expect(res.body.data.other_last_read_at).toBeNull();
    expect(res.body.data.other_user).not.toHaveProperty("allow_read_receipts");
  });
});
