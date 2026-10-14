import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";

// --- Mocks -----------------------------------------------------------------
const prismaMock = vi.hoisted(() => ({
  user: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
}));
vi.mock("../config/prismaClient", () => ({ default: prismaMock }));
const verifyIdToken = vi.hoisted(() => vi.fn());
vi.mock("../config/fireBase", () => ({
  admin: { auth: () => ({ verifyIdToken }) },
  isFirebaseConfigured: true,
  bucket: null,
}));

import app from "../app";

// ---------------------------------------------------------------------------

const passwordUser = {
  id: "user-1",
  email: "alice@example.com",
  username: "alice",
  display_name: "Alice",
  avatar_url: null,
  is_verified: false,
  is_active: true,
  provider: "local",
  onboarding_done: true,
  token_version: 0,
};

const token = (claims: Record<string, unknown>) =>
  verifyIdToken.mockResolvedValue({ uid: "fb-uid", email: "alice@example.com", ...claims });

const login = () => request(app).post("/api/authentication/social-login").send({ idToken: "x", provider: "google" });

beforeEach(() => {
  vi.clearAllMocks();
  prismaMock.user.findUnique.mockImplementation(async ({ include }: any) =>
    include ? { ...passwordUser, role: null } : passwordUser
  );
  prismaMock.user.update.mockImplementation(async ({ data }: any) => ({ ...passwordUser, ...data }));
});

describe("POST /api/authentication/social-login with an email that already has an account", () => {
  it("signs into the existing account when the provider verified the email (e.g. Google)", async () => {
    token({ email_verified: true, firebase: { sign_in_provider: "google.com" } });

    const res = await login();

    expect(res.status).toBe(200);
    expect(res.body.user.id).toBe("user-1");
    expect(prismaMock.user.create).not.toHaveBeenCalled();
    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { provider: "google.com", is_verified: true },
    });
  });

  it("refuses to attach an unverified provider email to another sign-in method", async () => {
    token({ email_verified: false, firebase: { sign_in_provider: "facebook.com" } });

    const res = await login();

    expect(res.status).toBe(409);
    expect(res.body.code).toBe("account_exists_with_different_method");
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });

  it("still lets a user back in with the provider they registered with", async () => {
    prismaMock.user.findUnique.mockImplementation(async ({ include }: any) => {
      const u = { ...passwordUser, provider: "facebook.com", is_verified: true };
      return include ? { ...u, role: null } : u;
    });
    token({ email_verified: false, firebase: { sign_in_provider: "facebook.com" } });

    const res = await login();

    expect(res.status).toBe(200);
  });
});
