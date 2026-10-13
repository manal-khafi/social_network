import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";

// --- Mocks -----------------------------------------------------------------
// No real database and no real Firebase bucket.
const prismaMock = vi.hoisted(() => ({ user: { findUnique: vi.fn() } }));
vi.mock("../config/prismaClient", () => ({ default: prismaMock }));

const bucketMock = vi.hoisted(() => ({ name: "test-bucket", upload: vi.fn() }));
vi.mock("../config/fireBase", () => ({
  admin: {},
  bucket: bucketMock,
  isFirebaseConfigured: true,
}));

import app from "../app";
import { generateAccessToken } from "../util/jwt";

// ---------------------------------------------------------------------------

// A backend JWT, as issued to an email/password user (no Firebase session).
const token = generateAccessToken({
  id: "user-1",
  email: "alice@example.com",
  username: "alice",
  permissions: [],
  onboarding_done: true,
});
const png = Buffer.from("fake-png-bytes");

beforeEach(() => {
  vi.clearAllMocks();
  bucketMock.upload.mockResolvedValue([{}]);
});

describe("POST /api/upload", () => {
  it("rejects unauthenticated requests", async () => {
    const res = await request(app)
      .post("/api/upload")
      .field("folder", "avatars")
      .attach("file", png, { filename: "a.png", contentType: "image/png" });

    expect(res.status).toBe(401);
    expect(bucketMock.upload).not.toHaveBeenCalled();
  });

  it("stores the file under the caller's folder and returns its URL", async () => {
    const res = await request(app)
      .post("/api/upload")
      .set("Authorization", `Bearer ${token}`)
      .field("folder", "avatars")
      .attach("file", png, { filename: "My Photo.PNG", contentType: "image/png" });

    expect(res.status).toBe(201);
    expect(bucketMock.upload).toHaveBeenCalledTimes(1);

    const [, options] = bucketMock.upload.mock.calls[0];
    expect(options.destination).toMatch(/^users\/user-1\/avatars\/\d+-[0-9a-f-]+\.png$/);
    expect(options.metadata.contentType).toBe("image/png");

    const downloadToken = options.metadata.metadata.firebaseStorageDownloadTokens;
    expect(res.body.url).toBe(
      `https://firebasestorage.googleapis.com/v0/b/test-bucket/o/${encodeURIComponent(
        options.destination
      )}?alt=media&token=${downloadToken}`
    );
  });

  it("rejects a missing file, a non-media file and an unknown folder", async () => {
    const auth = { Authorization: `Bearer ${token}` };

    const noFile = await request(app).post("/api/upload").set(auth).field("folder", "avatars");
    expect(noFile.status).toBe(400);

    const notMedia = await request(app)
      .post("/api/upload")
      .set(auth)
      .field("folder", "avatars")
      .attach("file", Buffer.from("#!/bin/sh"), { filename: "x.sh", contentType: "text/x-sh" });
    expect(notMedia.status).toBe(400);

    const badFolder = await request(app)
      .post("/api/upload")
      .set(auth)
      .field("folder", "../etc")
      .attach("file", png, { filename: "a.png", contentType: "image/png" });
    expect(badFolder.status).toBe(400);

    expect(bucketMock.upload).not.toHaveBeenCalled();
  });
});
