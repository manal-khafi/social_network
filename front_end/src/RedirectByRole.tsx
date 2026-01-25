import { Navigate } from "react-router-dom";
import { PATHS } from "./routes/paths";

const RedirectByRole = () => {
  const user = JSON.parse(localStorage.getItem("user") || "null");

  if (!user) {
    return <Navigate to={PATHS.AUTH} replace />;
  }

  return user.role === "super_admin"
    ? <Navigate to="/dashboard" replace />
    : <Navigate to={PATHS.HOME} replace />;
};

export default RedirectByRole;

