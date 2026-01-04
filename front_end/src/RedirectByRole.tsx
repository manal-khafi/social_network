import { Navigate } from "react-router-dom";

const RedirectByRole = () => {
  const user = JSON.parse(localStorage.getItem("user") || "null");

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return user.role === "super_admin"
    ? <Navigate to="/dashboard" replace />
    : <Navigate to="/index" replace />;
};

export default RedirectByRole;
