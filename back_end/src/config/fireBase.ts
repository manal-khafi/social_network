import admin from "firebase-admin";
import path from "path";
import { readFileSync } from "fs";

// 🔥 chemin absolu (plus fiable dans Docker)
const serviceAccountPath = path.join(__dirname, "serviceAccountKey.json");

// Lire le fichier JSON
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, "utf8"));

// Initialisation Firebase
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
  storageBucket: "exam9-1.appspot.com", // remplace par ton vrai bucket
});

const bucket = admin.storage().bucket();

export { admin, bucket };