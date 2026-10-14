import { initializeApp } from "firebase/app";
import { getAuth, browserLocalPersistence, setPersistence, signOut } from "firebase/auth";

// Firebase configuration. Values come from VITE_FIREBASE_* at build time and
// fall back to the existing project so local builds keep working unconfigured.
//
// Sign-in no longer goes through Firebase (Google sign-in is a backend OAuth
// redirect, see Components/Authentication/auth/socialAuth.tsx). The auth
// instance remains so logout also ends a Firebase session left over from the
// old popup sign-in.
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

export const firebaseSignOut = async () => {
  await signOut(auth);
};
