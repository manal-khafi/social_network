import { Provider } from "react-redux";
import { store } from "./store";
import { ForgotPassword } from "./components/Auth/ForgotPassword";

function App() {
  const handleBack = () => {
    // Implémentez la logique de retour ici (ex: navigation)
    console.log("Retour à la page précédente");
  };
  return (
    <Provider store={store}>
      <ForgotPassword onBack={handleBack} />
    </Provider>
  );
}

export default App;
