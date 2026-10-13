import { afterEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import type { Response } from "express";

// --- Mocks -----------------------------------------------------------------
const prismaMock = vi.hoisted(() => ({ user: { findUnique: vi.fn(), updateMany: vi.fn() } }));
vi.mock("../config/prismaClient", () => ({ default: prismaMock }));

import app, { allowedOrigins } from "../app";
import { setRefreshTokenCookie } from "../services/sessionService";

// ---------------------------------------------------------------------------

const cookieOptions = () => {
  const cookie = vi.fn();
  setRefreshTokenCookie({ cookie } as unknown as Response, { id: "user-1", token_version: 0 });
  return cookie.mock.calls[0][2];
};

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("refresh token cookie", () => {
  it("is SameSite=Lax + Secure in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(cookieOptions()).toMatchObject({ httpOnly: true, secure: true, sameSite: "lax" });
  });

  it("stays SameSite=Lax without Secure outside production (plain http on localhost)", () => {
    vi.stubEnv("NODE_ENV", "development");
    expect(cookieOptions()).toMatchObject({ httpOnly: true, secure: false, sameSite: "lax" });
  });
});

describe("origin check on state-changing requests", () => {
  const logout = () => request(app).post("/api/authentication/logout");

  it("rejects a POST from an origin that is not allowed", async () => {
    const res = await logout().set("Origin", "https://evil.example");
    expect(res.status).toBe(403);
    expect(prismaMock.user.updateMany).not.toHaveBeenCalled();
  });

  it("accepts a POST from an allowed origin", async () => {
    const res = await logout().set("Origin", allowedOrigins[0]);
    expect(res.status).toBe(200);
  });

  it("accepts a same-origin POST and requests without an Origin header", async () => {
    expect((await logout().set("Host", "app.test").set("Origin", "http://app.test")).status).toBe(200);
    expect((await logout()).status).toBe(200);
  });

  it("does not block cross-origin GET requests", async () => {
    const res = await request(app).get("/health").set("Origin", "https://evil.example");
    expect(res.status).toBe(200);
  });
});
