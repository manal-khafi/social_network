import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";

// --- Mocks -----------------------------------------------------------------
const prismaMock = vi.hoisted(() => ({
  user: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
}));
vi.mock("../config/prismaClient", () => ({ default: prismaMock }));
vi.mock("../config/fireBase", () => ({ admin: {}, isFirebaseConfigured: false, bucket: null }));

import app from "../app";

// ---------------------------------------------------------------------------

const googleUser = {
  id: "user-1",
  email: "alice@example.com",
  username: "alice",
  display_name: "Alice",
  avatar_url: null,
  is_verified: true,
  is_active: true,
  provider: "google.com",
  onboarding_done: true,
  token_version: 0,
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

/** Starts the flow and returns the state + cookie the callback must bring back. */
const start = async () => {
  const res = await request(app).get("/api/authentication/google");
  const location = new URL(res.headers.location);
  return { res, location, state: location.searchParams.get("state")!, cookie: res.headers["set-cookie"] };
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("FRONTEND_URL", "https://app.example.com");
  vi.stubEnv("GOOGLE_CLIENT_ID", "gid");
  vi.stubEnv("GOOGLE_CLIENT_SECRET", "gsecret");
  prismaMock.user.findUnique.mockImplementation(async ({ include }: any) =>
    include ? { ...googleUser, role: null } : googleUser
  );
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("GET /api/authentication/google", () => {
  it("redirects to Google with a state that is also kept in a cookie", async () => {
    const { res, location, state, cookie } = await start();

    expect(res.status).toBe(302);
    expect(location.origin + location.pathname).toBe("https://accounts.google.com/o/oauth2/v2/auth");
    expect(location.searchParams.get("client_id")).toBe("gid");
    expect(location.searchParams.get("redirect_uri")).toBe(
      "https://app.example.com/api/authentication/google/callback"
    );
    expect(state).toMatch(/^[0-9a-f]{48}$/);
    expect(String(cookie)).toContain(`oauth_state=google%3A${state}`);
  });

  it("sends the user back to the app when Google is not configured", async () => {
    vi.stubEnv("GOOGLE_CLIENT_ID", "");
    const res = await request(app).get("/api/authentication/google");

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe("https://app.example.com/#oauth_error=not_configured");
  });

  it("no longer offers Facebook sign-in", async () => {
    // No such route: unmatched /api paths answer 401/404, never an OAuth redirect.
    for (const path of ["/api/authentication/facebook", "/api/authentication/facebook/callback?code=x&state=y"]) {
      const res = await request(app).get(path);
      expect(res.status).not.toBe(302);
      expect(res.headers.location).toBeUndefined();
    }
  });
});

describe("GET /api/authentication/google/callback", () => {
  it("rejects a callback whose state does not match the cookie", async () => {
    const { cookie } = await start();
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const res = await request(app)
      .get("/api/authentication/google/callback?code=abc&state=forged")
      .set("Cookie", cookie);

    expect(res.headers.location).toBe("https://app.example.com/#oauth_error=invalid_state");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("signs in with Google and returns to /home with the token in the fragment", async () => {
    const { state, cookie } = await start();
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) =>
        String(url).includes("/token")
          ? json({ access_token: "google-at" })
          : json({ email: "Alice@Example.com", email_verified: true, name: "Alice" })
      )
    );

    const res = await request(app)
      .get(`/api/authentication/google/callback?code=abc&state=${state}`)
      .set("Cookie", cookie);

    expect(res.status).toBe(302);
    expect(res.headers.location).toMatch(/^https:\/\/app\.example\.com\/home#token=[\w.-]+$/);
    expect(String(res.headers["set-cookie"])).toContain("refreshToken=");
    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({ where: { email: "alice@example.com" } });
  });

  it("links a verified Google email to the existing email/password account", async () => {
    const local = { ...googleUser, provider: "local", is_verified: false };
    prismaMock.user.findUnique.mockImplementation(async ({ include }: any) => (include ? { ...local, role: null } : local));
    prismaMock.user.update.mockImplementation(async ({ data }: any) => ({ ...local, ...data }));
    const { state, cookie } = await start();
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) =>
        String(url).includes("/token")
          ? json({ access_token: "google-at" })
          : json({ email: "alice@example.com", email_verified: true })
      )
    );

    const res = await request(app)
      .get(`/api/authentication/google/callback?code=abc&state=${state}`)
      .set("Cookie", cookie);

    expect(res.headers.location).toMatch(/\/home#token=/);
    expect(prismaMock.user.create).not.toHaveBeenCalled();
    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { provider: "google.com", is_verified: true },
    });
  });

  it("does not attach an unverified Google email to an email/password account", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ ...googleUser, provider: "local" });
    const { state, cookie } = await start();
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) =>
        String(url).includes("/token")
          ? json({ access_token: "google-at" })
          : json({ email: "alice@example.com", email_verified: false })
      )
    );

    const res = await request(app)
      .get(`/api/authentication/google/callback?code=abc&state=${state}`)
      .set("Cookie", cookie);

    expect(res.headers.location).toBe(
      "https://app.example.com/#oauth_error=account_exists_with_different_method"
    );
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });

  it("reports a Google account that shares no email", async () => {
    const { state, cookie } = await start();
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) =>
        String(url).includes("/token") ? json({ access_token: "google-at" }) : json({ sub: "1", name: "Bob" })
      )
    );

    const res = await request(app)
      .get(`/api/authentication/google/callback?code=abc&state=${state}`)
      .set("Cookie", cookie);

    expect(res.headers.location).toBe("https://app.example.com/#oauth_error=no_email");
  });

  it("treats a refusal on the consent screen as a cancel", async () => {
    const res = await request(app).get("/api/authentication/google/callback?error=access_denied&state=x");
    expect(res.headers.location).toBe("https://app.example.com/#oauth_error=cancelled");
  });
});
