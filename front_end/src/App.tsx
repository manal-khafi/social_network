import AuthView from "./Views/authentification";
import { Route, Routes } from "react-router-dom";
import VerifyEmail from "./components/Authentification/auth/verifyEmil";
import RedirectByRole from "./RedirectByRole";
import Home from "./components/Home/Home";
import Dashboard from "./components/Home/Dashboard";
import { Provider } from "react-redux";
import { store } from "./store";
import { ForgotPasswordScreen } from "./components/Authentification/auth/ForgotPasswordScreen";
import { ResetPasswordScreen } from "./components/Authentification/auth/resetPassword";

function App() {
  const handleBack = () => {
    console.log("Retour à la page précédente");
  };

  return (
    <Provider store={store}>
      <Routes>
        <Route path="/" element={<AuthView />} />

        <Route
          path="/forgot-password"
          element={<ForgotPasswordScreen onBack={handleBack} />}
        />

        <Route
          path="/reset-password"
          element={
            <ResetPasswordScreen
              onSwitchToLogin={() => (window.location.href = "/")}
            />
          }
        />

        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/redirect" element={<RedirectByRole />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/index" element={<Home />} />
      </Routes>
    </Provider>
  );
}

export default App;
