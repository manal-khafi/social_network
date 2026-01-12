import AuthView from './Views/authentification';
import { Route, Routes } from 'react-router-dom';
import VerifyEmail from './Componenets/Authentification/auth/verifyEmil';
import RedirectByRole from './RedirectByRole';
import { Provider } from "react-redux";
import { store } from "./store";
import Home from "./Componenets/Home/home";
// import Choix from './Componenets/Acoount/Choix';
import { ForgotPasswordScreen } from "./Componenets/Authentification/auth/ForgotPasswordScreen";
import { ResetPasswordScreen } from "./Componenets/Authentification/auth/resetPassword";
import SetupProfile from './Componenets/Acoount/nameandimage';
import ChooseGender from './Componenets/Acoount/gender';
import PrivacySettings from './Componenets/Acoount/Privacy';
import PersonalizationWizard from './Componenets/Acoount/Viexgenerale';



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
            path="/personalization" 
            element={
              // <ProtectedRoute>
                <PersonalizationWizard />
              // </ProtectedRoute>
            } 
          />
        <Route path="/reset-password" 
        element={<ResetPasswordScreen onSwitchToLogin={() => window.location.href = '/'} />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/redirect" element={<RedirectByRole />} />
        <Route path="/personaliser/name&image" element={<SetupProfile />} />
        <Route path="/home" element={<Home/>} />
        <Route path="/personaliser/gender" element={<ChooseGender/>} />
        <Route path="/personaliser/privacy" element={<PrivacySettings/>} />
      </Routes>
    </Provider>
  );
}
export default App;