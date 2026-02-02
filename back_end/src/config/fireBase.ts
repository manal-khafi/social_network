
import admin from "firebase-admin";
import fs from "fs";

const bucketName = process.env.FIREBASE_STORAGE_BUCKET;
if (!bucketName) throw new Error("FIREBASE_STORAGE_BUCKET is missing");

const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

let serviceAccount: any;

if (serviceAccountPath) {
  serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));
} else {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) throw new Error("FIREBASE_SERVICE_ACCOUNT is missing");
  serviceAccount = JSON.parse(raw);
}

// ✅ CRITICAL: normalize private_key to valid PEM
if (typeof serviceAccount.private_key === "string") {
  serviceAccount.private_key = serviceAccount.private_key
    .replace(/\\n/g, "\n") // convert literal \n to real newlines
    .replace(/\r/g, "")    // remove CR if present
    .trim() + "\n";        // ensure ends with newline
} else {
  throw new Error("serviceAccount.private_key missing or not a string");
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: bucketName,
  });
}

export const bucket = admin.storage().bucket();
export { admin };