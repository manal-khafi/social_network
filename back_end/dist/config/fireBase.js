"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bucket = exports.admin = void 0;
const firebase_admin_1 = __importDefault(require("firebase-admin"));
exports.admin = firebase_admin_1.default;
const path_1 = __importDefault(require("path"));
const fs_1 = require("fs");
// 🔥 Essayer de charger depuis les variables d'environnement d'abord (Docker)
let serviceAccount;
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    // Depuis les variables d'environnement (Docker)
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
}
else {
    // Depuis le fichier local (développement)
    const serviceAccountPath = path_1.default.join(__dirname, "serviceAccountKey.json");
    if ((0, fs_1.existsSync)(serviceAccountPath)) {
        serviceAccount = JSON.parse((0, fs_1.readFileSync)(serviceAccountPath, "utf8"));
    }
    else {
        throw new Error("Firebase credentials not found. Set FIREBASE_SERVICE_ACCOUNT env var or add serviceAccountKey.json file.");
    }
}
// Initialisation Firebase
firebase_admin_1.default.initializeApp({
    credential: firebase_admin_1.default.credential.cert(serviceAccount),
    storageBucket: "exam9-1.appspot.com",
});
const bucket = firebase_admin_1.default.storage().bucket();
exports.bucket = bucket;
