import AuthView from './Views/authentification';
import {Route, Routes} from 'react-router-dom';
import VerifyEmail from './Componenets/Authentification/auth/verifyEmil';
import RedirectByRole from './RedirectByRole';
import Home from './Componenets/Home/Home';
import Dashboard from './Componenets/Home/Dashboard';

function App() {
  return (
    <>
       <Routes>
      <Route path="/" element={<AuthView />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/redirect" element={<RedirectByRole />} />


      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/index" element={<Home />} />
    </Routes>
    </>
  );
}

export default App;
