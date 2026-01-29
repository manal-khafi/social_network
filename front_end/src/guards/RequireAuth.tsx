import { useLocation, Navigate, Outlet } from "react-router-dom";
import { useAppSelector } from "../hooks";
import { useAuthSession } from "../hooks/useAuthSession";
import { PATHS } from "../routes/paths";

const RequireAuth = () => {
    const { isAuthenticated } = useAppSelector((state) => state.auth);
    const { isSessionLoading } = useAuthSession();
    const location = useLocation();

    if (isSessionLoading) {
        return <div>Loading session...</div>; // Or a spinner component
    }

    return (
        isAuthenticated
            ? <Outlet />
            : <Navigate to={PATHS.AUTH} state={{ from: location }} replace />
    );
}

export default RequireAuth;
