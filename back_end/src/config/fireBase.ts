import admin from "firebase-admin";
import path from "path";
import { readFileSync, existsSync } from "fs";

// 🔥 Charger les credentials Firebase Admin
// Anti-crash: si un fichier est présent mais corrompu, on retombe sur l'env.
let serviceAccount: any | null = null;
let serviceAccountSource: "env" | "file" | null = null;

const serviceAccountPath = path.join(__dirname, "serviceAccountKey.json");

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    serviceAccountSource = "env";
  } catch (e) {
    console.warn("[FirebaseAdmin] FIREBASE_SERVICE_ACCOUNT is not valid JSON; ignoring", {
      error: e instanceof Error ? e.message : String(e),
    });
  }
}

if (!serviceAccount && existsSync(serviceAccountPath)) {
  try {
    serviceAccount = JSON.parse(readFileSync(serviceAccountPath, "utf8"));
    serviceAccountSource = "file";
  } catch (e) {
    console.warn("[FirebaseAdmin] serviceAccountKey.json is not valid JSON; ignoring", {
      error: e instanceof Error ? e.message : String(e),
    });
  }
}

if (!serviceAccount) {
  throw new Error(
    "Firebase credentials not found or invalid. Provide FIREBASE_SERVICE_ACCOUNT (JSON) or a valid serviceAccountKey.json."
  );
}

// Initialisation Firebase
if (serviceAccount?.private_key && typeof serviceAccount.private_key === "string") {
  // Common Docker/YAML issue: private keys end up with literal '\n' sequences.
  serviceAccount.private_key = serviceAccount.private_key
    .replace(/\\n/g, "\n")
    .replace(/\r\n/g, "\n");
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
  storageBucket: "exam9-1.appspot.com",
});

console.info("[FirebaseAdmin] initialized", {
  source: serviceAccountSource,
  projectId: serviceAccount?.project_id,
  clientEmail: serviceAccount?.client_email,
  privateKeyId: serviceAccount?.private_key_id,
  privateKeyLength: typeof serviceAccount?.private_key === "string" ? serviceAccount.private_key.length : null,
  hasNewlines: typeof serviceAccount?.private_key === "string" ? serviceAccount.private_key.includes("\n") : null,
  bucket: "exam9-1.appspot.com",
});

const bucket = admin.storage().bucket();

export { admin, bucket };
