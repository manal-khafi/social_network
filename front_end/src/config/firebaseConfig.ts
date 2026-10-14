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
//
// authDomain is the app's own domain: the sign-in helper pages (/__/auth/*) are
// served from it through a rewrite to <project>.firebaseapp.com (Render static
// site rule, see DEPLOYMENT.md). With the default firebaseapp.com domain,
// browsers that partition third-party storage (Safari, Firefox, Chrome on
// mobile...) lose the sign-in state: "Unable to process request due to missing
// initial state".
const firebaseConfig = {
  // `||`, not `??`: Docker Compose passes unset VITE_FIREBASE_* build args as
  // empty strings, which must fall back too.
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyB-_LdK61ci1bcga_AEjOiaiLtyV8JpGqQ",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "www.anmougar.online",
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

/** Popup sign-in on every device; resolves with the Firebase user. */
const signInWith = async (provider: GoogleAuthProvider | FacebookAuthProvider, name: string) => {
  try {
    // DEBUG(social-login): remove once mobile sign-in is confirmed working.
    console.log(`[social-auth] ${name}: calling signInWithPopup (authDomain: ${auth.config.authDomain})`);
    const result = await signInWithPopup(auth, provider);
    console.log(`[social-auth] ${name}: popup returned user`, result.user?.uid ?? null);
    return result.user;
  } catch (error) {
    const e = error as { code?: string; message?: string };
    console.log(`[social-auth] ${name}: popup failed`, e?.code, e?.message);
    console.error(`${name} sign-in error:`, error);
    throw error;
  }
};

export const loginWithGoogle = () => signInWith(googleProvider, "Google");
export const loginWithFacebook = () => signInWith(facebookProvider, "Facebook");

export const firebaseSignOut = async () => {
  await signOut(auth);
};
