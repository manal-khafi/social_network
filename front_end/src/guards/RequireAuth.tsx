import { useLocation, Navigate, Outlet } from "react-router-dom";
import { useAppSelector } from "../hooks";
import { PATHS } from "../routes/paths";

const RequireAuth = () => {
    const { isAuthenticated } = useAppSelector((state) => state.auth);
    const location = useLocation();

    return (
        isAuthenticated
            ? <Outlet />
            : <Navigate to={PATHS.AUTH} state={{ from: location }} replace />
    );
}

export default RequireAuth;
