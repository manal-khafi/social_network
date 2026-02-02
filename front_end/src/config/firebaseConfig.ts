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
  apiKey: "AIzaSyAq6Vo7gz1fY4Mf2EblG03hR3j5JrQzw94",
  authDomain: "anmougar-34ca5.firebaseapp.com",
  projectId: "anmougar-34ca5",
  storageBucket: "anmougar-34ca5.firebasestorage.app",
  messagingSenderId: "92379338595",
  appId: "1:92379338595:web:e1bbb2691489a5aa23a556",
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
