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
import { getStorage } from "firebase/storage"; // ✅ ADD THIS

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCKB3zKrAUvWBJ3E83tLlLw5vGvfrOqX1E",
  authDomain: "exam9-1.firebaseapp.com",
  projectId: "exam9-1",
  storageBucket: "exam9-1.appspot.com",
  messagingSenderId: "479705895775",
  appId: "1:479705895775:web:49446745724018e8cd5cea",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// 🔐 Auth
export const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence);

// 📦 Storage (FOR AVATAR / COVER UPLOADS)
export const storage = getStorage(app); // ✅ THIS IS WHAT YOU NEED

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
