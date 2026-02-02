import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  FacebookAuthProvider,
  browserLocalPersistence,
  setPersistence,
  signOut,
  type User,
} from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAq6Vo7gz1fY4Mf2EblG03hR3j5JrQzw94",
  authDomain: "anmougar-34ca5.firebaseapp.com",
  projectId: "anmougar-34ca5",
  storageBucket: "anmougar-34ca5.firebasestorage.app",
  messagingSenderId: "92379338595",
  appId: "1:92379338595:web:e1bbb2691489a5aa23a556",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Auth
export const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence);

// Storage
export const storage = getStorage(app);

// Providers
const googleProvider = new GoogleAuthProvider();
const facebookProvider = new FacebookAuthProvider();

// Existing exports
export const loginWithGoogle = async (): Promise<User> => {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
};

export const loginWithFacebook = async (): Promise<User> => {
  const result = await signInWithPopup(auth, facebookProvider);
  return result.user;
};

export const firebaseSignOut = async () => {
  await signOut(auth);
};

// ✅ ADD THIS (THIS IS WHAT YOUR SCREENS EXPECT)
type Provider = "google" | "facebook";

export const handleSocialAuth = async (provider: Provider): Promise<User> => {
  if (provider === "google") return loginWithGoogle();
  if (provider === "facebook") return loginWithFacebook();
  throw new Error("Unsupported provider");
};
