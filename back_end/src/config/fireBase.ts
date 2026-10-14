import dotenv from "dotenv";
dotenv.config();

import admin from "firebase-admin";
import fs from "fs";
import { logger } from "../util/logger";

/**
 * Firebase Admin SDK, used to verify the ID tokens sent by Google / Facebook
 * sign-in (see Controllers/Authentication/social.ts).
 *
 * Credentials come from ONE of:
 *   FIREBASE_SERVICE_ACCOUNT_PATH  path to the service-account JSON file
 *   FIREBASE_SERVICE_ACCOUNT       the service-account JSON itself, on one line
 * FIREBASE_STORAGE_BUCKET is optional (only needed for server-side Storage).
 *
 * Firebase is optional: when it is not configured (or the credentials are
 * invalid) the API still starts, `isFirebaseConfigured` is false and social
 * login answers 503 instead of crashing the whole server.
 */
const loadServiceAccount = (): Record<string, any> | null => {
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;

  if (!serviceAccountPath && !raw) return null;

  const serviceAccount = serviceAccountPath
    ? JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"))
    : JSON.parse(raw as string);

  // Normalize private_key to valid PEM: env files usually carry literal "\n".
  if (typeof serviceAccount.private_key !== "string") {
    throw new Error("serviceAccount.private_key missing or not a string");
  }
  serviceAccount.private_key =
    serviceAccount.private_key.replace(/\\n/g, "\n").replace(/\r/g, "").trim() + "\n";

  return serviceAccount;
};

const bucketName = process.env.FIREBASE_STORAGE_BUCKET || undefined;

let isFirebaseConfigured = false;

try {
  const serviceAccount = loadServiceAccount();

  if (!serviceAccount) {
    logger.warn(
      "Firebase is not configured (set FIREBASE_SERVICE_ACCOUNT_PATH or FIREBASE_SERVICE_ACCOUNT): social login is disabled"
    );
  } else {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
        ...(bucketName && { storageBucket: bucketName }),
      });
    }
    isFirebaseConfigured = true;
  }
} catch (err) {
  logger.error({ err }, "Firebase initialisation failed: social login is disabled");
}

const bucket = isFirebaseConfigured && bucketName ? admin.storage().bucket() : null;

export { admin, bucket, isFirebaseConfigured };
