import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  FacebookAuthProvider,
  browserLocalPersistence,
  setPersistence,
  signOut, // Added for logout
} from "firebase/auth";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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
export const auth = getAuth(app);

// Enforce local persistence (Step 3)
setPersistence(auth, browserLocalPersistence);

// Providers
const googleProvider = new GoogleAuthProvider();
const facebookProvider = new FacebookAuthProvider();

// Auth functions (Step 4)
export const signInWithGoogle = async () => {
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

export const signInWithFacebook = async () => {
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
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Firebase sign out error:", error);
    throw error;
  }
};
