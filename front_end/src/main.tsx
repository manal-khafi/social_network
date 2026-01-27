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
import { auth } from "./config/firebaseConfig"; // Import Firebase auth instance
import { onAuthStateChanged } from "firebase/auth";
import { setAuthLoading, setFirebaseUser } from "./features/auth/authSlice"; // Import actions from authSlice
import { toSafeUser } from "./utils/authUtils"; // Import toSafeUser helper

store.dispatch(setAuthLoading()); 

onAuthStateChanged(auth, async (user) => {
  if (user) {
    const serializableUser = toSafeUser(user); // Convert Firebase User to serializable object
    store.dispatch(setFirebaseUser(serializableUser));
    console.log("DEBUG: Firebase user logged in. UID:", user.uid);
  } else {
    store.dispatch(setFirebaseUser(null));
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
