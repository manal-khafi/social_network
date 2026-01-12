import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  FacebookAuthProvider,
  type User,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCKB3zKrAUvWBJ3E83tLlLw5vGvfrOqX1E",
  authDomain: "exam9-1.firebaseapp.com",
  projectId: "exam9-1",
  storageBucket: "exam9-1.appspot.com",
  messagingSenderId: "479705895775",
  appId: "1:479705895775:web:49446745724018e8cd5cea",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

const googleProvider = new GoogleAuthProvider();
const facebookProvider = new FacebookAuthProvider();

// ✅ Named exports
export const loginWithGoogle = async (): Promise<User> => {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
};

export const loginWithFacebook = async (): Promise<User> => {
  const result = await signInWithPopup(auth, facebookProvider);
  return result.user;
};