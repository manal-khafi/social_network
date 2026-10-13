import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  FacebookAuthProvider,
  browserLocalPersistence,
  setPersistence,
  signOut,
} from "firebase/auth";

// Firebase configuration. Values come from VITE_FIREBASE_* at build time and
// fall back to the existing project so local builds keep working unconfigured.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCKB3zKrAUvWBJ3E83tLlLw5vGvfrOqX1E",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "exam9-1.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "exam9-1",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "exam9-1.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "479705895775",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:479705895775:web:49446745724018e8cd5cea",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// 🔐 Auth
export const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence);

// Providers
const googleProvider = new GoogleAuthProvider();
const facebookProvider = new FacebookAuthProvider();

// Auth functions (Step 4)
export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    // User signed in successfully
    // The Firebase SDK automatically manages idToken and refreshToken
    return result.user;
  } catch (error) {
    console.error("Google sign-in error:", error);
    throw error;
  }
};

export const loginWithFacebook = async () => {
  try {
    const result = await signInWithPopup(auth, facebookProvider);
    // User signed in successfully
    // The Firebase SDK automatically manages idToken and refreshToken
    return result.user;
  } catch (error) {
    console.error("Facebook sign-in error:", error);
    throw error;
  }
};

export const firebaseSignOut = async () => {
  await signOut(auth);
};
