import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { ThemeProvider } from "next-themes";
import { I18nextProvider } from "react-i18next";
import { store } from "./store";
import i18n from "./i18n/i18n";
import App from "./App";
import { Toaster } from "./Components/ui/sonner";
import "./style/index.css";
import { auth } from "./config/firebase"; // Import Firebase auth instance
import { onAuthStateChanged } from "firebase/auth";
import { setAuth, setAuthLoading } from "./features/auth/authSlice"; // Import actions from authSlice
import { toSafeUser } from "./utils/authUtils"; // Import toSafeUser helper

// Global Firebase Auth State Listener
store.dispatch(setAuthLoading()); // Set loading state initially

onAuthStateChanged(auth, async (user) => {
  if (user) {
    // User is signed in, get the ID token
    const idToken = await user.getIdToken();
    const serializableUser = toSafeUser(user); // Convert Firebase User to serializable object
    store.dispatch(setAuth({ firebaseUser: serializableUser, token: idToken }));
    console.log("DEBUG: Firebase user logged in. UID:", user.uid);
    console.log("DEBUG: Firebase ID token length (main.tsx):", idToken.length);
    // Optionally, if your backend user profile needs to be fetched
    // store.dispatch(fetchMe()); // You might want to fetch backend user data here
  } else {
    // User is signed out
    store.dispatch(setAuth({ firebaseUser: null, token: "" }));
    console.log("DEBUG: Firebase user logged out.");
  }
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Provider store={store}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <I18nextProvider i18n={i18n}>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </I18nextProvider>
        <Toaster />
      </ThemeProvider>
    </Provider>
  </React.StrictMode>
);
