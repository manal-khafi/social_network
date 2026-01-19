import AuthView from './Views/authentification';
import { Route, Routes } from 'react-router-dom';
import VerifyEmail from './Componenets/Authentification/auth/verifyEmil';
import RedirectByRole from './RedirectByRole';
import Home from './Componenets/Home/Home';
import Dashboard from './Componenets/Home/Dashboard';
import { Provider } from "react-redux";
import { store } from "./store";
import { ForgotPasswordScreen } from "./Componenets/Authentification/auth/ForgotPasswordScreen";
import { ResetPasswordScreen } from "./Componenets/Authentification/auth/resetPassword";
import { CommunityList } from './Views/communityList';
import { CommunityPageWrapper } from './Views/communityPage';
import { CreateCommunity } from './Views/createCommunity';

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

        <Route path="/reset-password" 
        element={<ResetPasswordScreen onSwitchToLogin={() => window.location.href = '/'} />} />

        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/redirect" element={<RedirectByRole />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/index" element={<Home />} />

        <Route path='/community' element={<CommunityList onSelectCommunity={(id) => console.log(id)} onCreateClick={() => console.log("Create community")} />} />
        <Route path='/community/:communityId' element={<CommunityPageWrapper onBack={handleBack} />} />
        <Route path='/community/create' element={<CreateCommunity onBack={handleBack} onSubmit={(data) => console.log(data)} />} />
      </Routes>
    </Provider>
  );
}

export default App;
