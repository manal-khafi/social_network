import AuthView from './Views/authentification';
import { Route, Routes } from 'react-router-dom';
import VerifyEmail from './Componenets/Authentification/auth/verifyEmil';
import RedirectByRole from './RedirectByRole';
import Home from './Componenets/Home/Home';
import Dashboard from './Componenets/Home/Dashboard';
import { Provider } from "react-redux";
import { store } from "./store";
import { ForgotPassword } from "./Componenets/Authentification/ForgotPassword";

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
          element={<ForgotPassword onBack={handleBack} />}
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
