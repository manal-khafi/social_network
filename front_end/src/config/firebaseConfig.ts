import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  FacebookAuthProvider,
  browserLocalPersistence,
  setPersistence,
  signOut,
} from "firebase/auth";

// Firebase configuration. Values come from VITE_FIREBASE_* at build time and
// fall back to the existing project so local builds keep working unconfigured.
const firebaseConfig = {
  // `||`, not `??`: Docker Compose passes unset VITE_FIREBASE_* build args as
  // empty strings, which must fall back too.
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyB-_LdK61ci1bcga_AEjOiaiLtyV8JpGqQ",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "anmougar-64b3e.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "anmougar-64b3e",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "anmougar-64b3e.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "873439131822",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:873439131822:web:b3182b0ae8b7a682ae953f",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// 🔐 Auth
export const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence);

// Providers
const googleProvider = new GoogleAuthProvider();
const facebookProvider = new FacebookAuthProvider();

/** Phones and tablets: sign in with a full-page redirect instead of a popup. */
export const isMobileBrowser = () =>
  typeof navigator !== "undefined" && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

/**
 * Desktop: popup, resolves with the Firebase user. Mobile: redirect to the
 * provider; the page is left, so this resolves with null and the result is
 * picked up by completeSocialRedirect() when the app loads again.
 */
const signInWith = async (provider: GoogleAuthProvider | FacebookAuthProvider, name: string) => {
  try {
    if (isMobileBrowser()) {
      await signInWithRedirect(auth, provider);
      return null;
    }
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    console.error(`${name} sign-in error:`, error);
    throw error;
  }
};

export const loginWithGoogle = () => signInWith(googleProvider, "Google");
export const loginWithFacebook = () => signInWith(facebookProvider, "Facebook");

/** Result of a redirect sign-in started on a previous page load (null if none). */
export const getSocialRedirectResult = () => getRedirectResult(auth);

export const firebaseSignOut = async () => {
  await signOut(auth);
};
