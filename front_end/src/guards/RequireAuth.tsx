import { useLocation, Navigate, Outlet } from "react-router-dom";
import { useAppSelector } from "../hooks";
import { useAuthSession } from "../hooks/useAuthSession";
import { PATHS } from "../routes/paths";

const RequireAuth = () => {
    const { isAuthenticated, user } = useAppSelector((state) => state.auth);
    const { isSessionLoading } = useAuthSession();
    const location = useLocation();

    if (isSessionLoading) {
        return <div>Loading session...</div>; // Or a spinner component
    }

    if (isAuthenticated && user?.onboarding_done === false && location.pathname !== PATHS.PERSONALIZE) {
        return <Navigate to={PATHS.PERSONALIZE} state={{ from: location }} replace />;
    }

    return (
        isAuthenticated
            ? <Outlet />
            : <Navigate to={PATHS.AUTH} state={{ from: location }} replace />
    );
}

export default RequireAuth;
