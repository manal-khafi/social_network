import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";

// --- Mocks -----------------------------------------------------------------
const prismaMock = vi.hoisted(() => ({ user: { findUnique: vi.fn() } }));
vi.mock("../config/prismaClient", () => ({ default: prismaMock }));

import app from "../app";
import { generateAccessToken } from "../util/jwt";

// ---------------------------------------------------------------------------

// The token was issued while the user still had their old avatar.
const token = generateAccessToken({
  id: "user-1",
  email: "alice@example.com",
  username: "alice",
  avatar_url: "https://cdn.example/old.png",
  permissions: [],
  onboarding_done: true,
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/authentication/me", () => {
  it("returns the avatar currently saved, not the one frozen in the access token", async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      username: "alice",
      avatar_url: "https://cdn.example/new.png",
      display_name: "Alice",
      onboarding_done: true,
    });

    const res = await request(app).get("/api/authentication/me").set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({
      id: "user-1",
      username: "alice",
      avatar_url: "https://cdn.example/new.png",
    });
  });

  it("answers 401 when the account no longer exists", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    const res = await request(app).get("/api/authentication/me").set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(401);
  });
});
