import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import bcrypt from "bcrypt";

// --- Mocks -----------------------------------------------------------------
const prismaMock = vi.hoisted(() => ({
  user: { findFirst: vi.fn(), findUnique: vi.fn(), update: vi.fn(), delete: vi.fn() },
}));
vi.mock("../config/prismaClient", () => ({ default: prismaMock }));
const firebase = vi.hoisted(() => ({
  getUserByEmail: vi.fn(),
  deleteUser: vi.fn(),
  deleteFiles: vi.fn(),
}));
vi.mock("../config/fireBase", () => ({
  admin: { auth: () => ({ getUserByEmail: firebase.getUserByEmail, deleteUser: firebase.deleteUser }) },
  isFirebaseConfigured: true,
  bucket: { deleteFiles: firebase.deleteFiles },
}));

import app from "../app";
import { generateAccessToken } from "../util/jwt";

// ---------------------------------------------------------------------------

const token = generateAccessToken({ id: "user-1", email: "alice@example.com", username: "alice", permissions: [] });
const auth = (r: request.Test) => r.set("Authorization", `Bearer ${token}`);

const passwordUser = {
  id: "user-1",
  username: "alice",
  email: "alice@example.com",
  display_name: "Alice",
  avatar_url: null,
  password_hash: bcrypt.hashSync("correct-password", 4),
  is_verified: true,
  is_active: true,
  two_factor_enabled: false,
  token_version: 3,
  onboarding_done: true,
  role: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  prismaMock.user.findUnique.mockResolvedValue(passwordUser);
  prismaMock.user.update.mockImplementation(async ({ data }: any) => ({ ...passwordUser, ...data }));
  firebase.deleteFiles.mockResolvedValue(undefined);
});

describe("POST /api/account/me/deactivate", () => {
  it("hides the account and signs it out everywhere", async () => {
    const res = await auth(request(app).post("/api/account/me/deactivate")).send({
      password: "correct-password",
      reason: "taking a break",
    });

    expect(res.status).toBe(200);
    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { is_active: false, token_version: { increment: 1 } },
    });
    expect(String(res.headers["set-cookie"])).toMatch(/refreshToken=;/);
  });

  it("refuses a wrong password", async () => {
    const res = await auth(request(app).post("/api/account/me/deactivate")).send({
      password: "nope",
      reason: "x",
    });
    expect(res.status).toBe(401);
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });

  it("works for a Google account, which has no password", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ ...passwordUser, password_hash: null });
    const res = await auth(request(app).post("/api/account/me/deactivate")).send({ reason: "x" });
    expect(res.status).toBe(200);
  });
});

describe("DELETE /api/account/me/delete", () => {
  it("deletes the user, their files and their Firebase account", async () => {
    firebase.getUserByEmail.mockResolvedValue({ uid: "fb-1" });

    const res = await auth(request(app).delete("/api/account/me/delete")).send({
      password: "correct-password",
      reason: "bye",
    });

    expect(res.status).toBe(200);
    expect(prismaMock.user.delete).toHaveBeenCalledWith({ where: { id: "user-1" } });
    expect(firebase.deleteFiles).toHaveBeenCalledWith({ prefix: "users/user-1/", force: true });
    expect(firebase.deleteUser).toHaveBeenCalledWith("fb-1");
  });

  it("still succeeds when there is no Firebase account (email/password sign-up)", async () => {
    firebase.getUserByEmail.mockRejectedValue(Object.assign(new Error("none"), { code: "auth/user-not-found" }));
    const res = await auth(request(app).delete("/api/account/me/delete")).send({
      password: "correct-password",
      reason: "bye",
    });
    expect(res.status).toBe(200);
  });
});

describe("POST /api/authentication/login on a deactivated account", () => {
  beforeEach(() => {
    prismaMock.user.findFirst.mockResolvedValue({ ...passwordUser, is_active: false });
  });

  it("asks whether to reactivate instead of signing in", async () => {
    const res = await request(app)
      .post("/api/authentication/login")
      .send({ email: "alice@example.com", password: "correct-password" });

    expect(res.status).toBe(403);
    expect(res.body.code).toBe("account_deactivated");
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });

  it("reactivates and signs in when the user confirms", async () => {
    const res = await request(app)
      .post("/api/authentication/login")
      .send({ email: "alice@example.com", password: "correct-password", reactivate: true });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
    expect(prismaMock.user.update).toHaveBeenCalledWith({ where: { id: "user-1" }, data: { is_active: true } });
  });

  it("does not reveal the deactivated state to a wrong password", async () => {
    const res = await request(app)
      .post("/api/authentication/login")
      .send({ email: "alice@example.com", password: "nope", reactivate: true });

    expect(res.status).toBe(401);
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });
});
