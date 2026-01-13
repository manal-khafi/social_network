import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
// import { ThemeProvider } from "next-themes";
import { store } from "./store";
import App from "./App";
import { Toaster } from "./Componenets/ui/sonner";
import "./style/index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Provider store={store}>
      {/* <ThemeProvider attribute="class" defaultTheme="light" enableSystem> */}
        <BrowserRouter>
          <App />
        </BrowserRouter>
        <Toaster />
      {/* </ThemeProvider> */}
    </Provider>
  </React.StrictMode>
);
