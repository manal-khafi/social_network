import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";

// --- Mocks -----------------------------------------------------------------
const prismaMock = vi.hoisted(() => ({
  post: { findFirst: vi.fn(), count: vi.fn() },
  user: { findMany: vi.fn() },
  block: { findMany: vi.fn() },
}));
vi.mock("../config/prismaClient", () => ({ default: prismaMock }));
vi.mock("../util/prisma", () => ({ default: prismaMock }));
const sendPostShare = vi.hoisted(() => vi.fn());
vi.mock("../services/conversation.service", () => ({ ConversationService: { sendPostShare } }));

import app from "../app";
import { generateAccessToken } from "../util/jwt";

// ---------------------------------------------------------------------------

const POST_ID = "11111111-1111-1111-1111-111111111111";
const token = generateAccessToken({ id: "me", email: "me@example.com", username: "me", permissions: [] });
const share = (body: unknown) =>
  request(app).post(`/api/posts/${POST_ID}/share`).set("Authorization", `Bearer ${token}`).send(body);

beforeEach(() => {
  vi.clearAllMocks();
  prismaMock.block.findMany.mockResolvedValue([]);
  prismaMock.post.findFirst.mockResolvedValue({ id: POST_ID, user_id: "author" });
  prismaMock.user.findMany.mockResolvedValue([{ id: "bob" }, { id: "carol" }]);
  sendPostShare.mockResolvedValue({});
});

describe("POST /api/posts/:postId/share", () => {
  it("sends a post card to every recipient allowed to see the post", async () => {
    prismaMock.post.count.mockImplementation(async ({ where }: any) =>
      // carol cannot see it (e.g. private account she does not follow)
      JSON.stringify(where).includes("carol") ? 0 : 1
    );

    const res = await share({ recipient_ids: ["bob", "carol", "me"], note: " look " });

    expect(res.status).toBe(201);
    expect(res.body.data).toEqual({ shared_count: 1, skipped_count: 1 });
    expect(sendPostShare).toHaveBeenCalledTimes(1);
    expect(sendPostShare).toHaveBeenCalledWith("me", "bob", POST_ID, "look");
  });

  it("answers 404 for a post the sender cannot see", async () => {
    prismaMock.post.findFirst.mockResolvedValue(null);
    const res = await share({ recipient_ids: ["bob"] });
    expect(res.status).toBe(404);
    expect(sendPostShare).not.toHaveBeenCalled();
  });

  it("rejects an empty or oversized recipient list", async () => {
    expect((await share({ recipient_ids: [] })).status).toBe(400);
    const many = Array.from({ length: 26 }, (_, i) => `u${i}`);
    expect((await share({ recipient_ids: many })).status).toBe(400);
  });
});
