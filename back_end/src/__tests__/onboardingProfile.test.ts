import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";

// --- Mocks -----------------------------------------------------------------
const prismaMock = vi.hoisted(() => ({ user: { findUnique: vi.fn(), update: vi.fn() } }));
vi.mock("../config/prismaClient", () => ({ default: prismaMock }));

import app from "../app";
import { generateAccessToken } from "../util/jwt";

// ---------------------------------------------------------------------------

const auth = {
  Authorization: `Bearer ${generateAccessToken({
    id: "user-1",
    email: "alice@example.com",
    username: "alice",
    permissions: [],
    onboarding_done: false,
  })}`,
};

const submit = (profile: Record<string, unknown>) =>
  request(app)
    .post("/api/Compte/update/profile")
    .set(auth)
    .send({ userData: JSON.stringify({ profile: { username: "alice", ...profile }, privacy: { type: "public" } }) });

const savedData = () => prismaMock.user.update.mock.calls[0][0].data;

beforeEach(() => {
  vi.clearAllMocks();
  prismaMock.user.update.mockResolvedValue({ id: "user-1" });
});

describe("POST /api/Compte/update/profile (onboarding)", () => {
  it("saves the uploaded picture's URL as the avatar", async () => {
    const url = "https://firebasestorage.googleapis.com/v0/b/bucket/o/avatar.png?alt=media&token=t";
    const res = await submit({ avatarUrl: url });

    expect(res.status).toBe(200);
    expect(savedData().avatar_url).toBe(url);
  });

  it("keeps the current avatar when no picture is sent", async () => {
    const res = await submit({});

    expect(res.status).toBe(200);
    expect(savedData()).not.toHaveProperty("avatar_url");
  });

  it("clears the avatar when the picture was removed", async () => {
    await submit({ avatarUrl: null });
    expect(savedData().avatar_url).toBeNull();
  });

  it("rejects an avatar that is not an http(s) URL", async () => {
    const res = await submit({ avatarUrl: "javascript:alert(1)" });

    expect(res.status).toBe(400);
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });
});
