import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import bcrypt from "bcrypt";

// --- Mocks -----------------------------------------------------------------
// No real database: every module imports the shared client from
// config/prismaClient, so mocking that one module covers the whole app.
const prismaMock = vi.hoisted(() => ({
  user: {
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    delete: vi.fn(),
  },
}));
vi.mock("../config/prismaClient", () => ({ default: prismaMock }));

// No real emails either.
const emailMock = vi.hoisted(() => ({
  sendEmail: vi.fn(),
  sendVerificationEmail: vi.fn(),
  sendResetPasswordEmail: vi.fn(),
}));
vi.mock("../util/EempleEmail", () => emailMock);

import app from "../app";

// ---------------------------------------------------------------------------

const existingUser = {
  id: "user-1",
  username: "alice",
  email: "alice@example.com",
  display_name: "Alice",
  avatar_url: null,
  password_hash: bcrypt.hashSync("correct-password", 4),
  is_verified: true,
  is_active: true,
  two_factor_enabled: false,
  token_version: 0,
  onboarding_done: true,
  role: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  delete process.env.AUTH_AUTO_VERIFY;
  emailMock.sendVerificationEmail.mockResolvedValue(undefined);
  emailMock.sendResetPasswordEmail.mockResolvedValue(undefined);
});

// Registration is mounted at the router root: POST /api/authentication
describe("POST /api/authentication (register)", () => {
  const validBody = {
    username: "bob",
    email: "bob@example.com",
    password: "s3cret-password",
    confirmPassword: "s3cret-password",
    display_name: "Bob",
    adresse: "12 Main Street, Springfield",
    date_of_birth: "1995-04-12",
  };

  it("returns 201 with valid data, and the account still has to verify its email", async () => {
    prismaMock.user.findFirst.mockResolvedValue(null);
    prismaMock.user.create.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
      id: "user-2",
      onboarding_done: false,
      ...data,
    }));

    const res = await request(app).post("/api/authentication").send(validBody);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.user).toMatchObject({ username: "bob", email: "bob@example.com" });
    expect(res.body.user).not.toHaveProperty("password_hash");

    const created = prismaMock.user.create.mock.calls[0][0].data;
    expect(created.is_verified).toBe(false);
    expect(created.password_hash).not.toBe(validBody.password);
    expect(emailMock.sendVerificationEmail).toHaveBeenCalledTimes(1);
  });
});

describe("POST /api/authentication/login", () => {
  it("returns 401 with a wrong password", async () => {
    prismaMock.user.findFirst.mockResolvedValue(existingUser);

    const res = await request(app)
      .post("/api/authentication/login")
      .send({ email: existingUser.email, password: "wrong-password" });

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ success: false, message: "Invalid credentials" });
    expect(res.headers["set-cookie"]).toBeUndefined();
  });

  it("returns 401 (not 404) for an unknown email, with the same body as a wrong password", async () => {
    prismaMock.user.findFirst.mockResolvedValue(null);

    const res = await request(app)
      .post("/api/authentication/login")
      .send({ email: "nobody@example.com", password: "whatever-password" });

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ success: false, message: "Invalid credentials" });
    expect(res.headers["set-cookie"]).toBeUndefined();
  });
});

describe("POST /api/authentication/forgot-password", () => {
  it("returns the same 200 response whether or not the email exists", async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce(existingUser);
    const known = await request(app)
      .post("/api/authentication/forgot-password")
      .send({ email: existingUser.email });

    prismaMock.user.findUnique.mockResolvedValueOnce(null);
    const unknown = await request(app)
      .post("/api/authentication/forgot-password")
      .send({ email: "nobody@example.com" });

    expect(known.status).toBe(200);
    expect(unknown.status).toBe(200);
    expect(unknown.body).toEqual(known.body);

    // A reset email only goes out for the account that exists.
    expect(emailMock.sendResetPasswordEmail).toHaveBeenCalledTimes(1);
    expect(emailMock.sendResetPasswordEmail.mock.calls[0][0]).toBe(existingUser.email);
  });
});

describe("GET /api/rtc/ice-servers", () => {
  it("returns 401 without an auth token", async () => {
    const res = await request(app).get("/api/rtc/ice-servers");

    expect(res.status).toBe(401);
    expect(res.body).not.toHaveProperty("iceServers");
  });
});
