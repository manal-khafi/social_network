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
import { auth } from "./config/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { setAuth, setAuthLoading } from "./features/auth/authSlice";
import { toSafeUser } from "./utils/authUtils"; 
import { fetchCurrentUserProfile } from "./features/user/userSlice";

store.dispatch(setAuthLoading()); 

onAuthStateChanged(auth, async (user) => {
  if (user) {
    const idToken = await user.getIdToken();
    const serializableUser = toSafeUser(user);

    store.dispatch(setAuth({ firebaseUser: serializableUser, token: idToken }));

    // ✅ fetch backend user profile into userSlice.currentUser
    store.dispatch(fetchCurrentUserProfile());
  } else {
    store.dispatch(setAuth({ firebaseUser: null, token: null }));
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
