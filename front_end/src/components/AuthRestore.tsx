import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../hooks";
import { verifyAuth } from "../features/auth/authSlice";

export default function AuthRestore() {
  const dispatch = useAppDispatch();
  const { isAuthenticated, loading } = useAppSelector((state) => state.auth);

  useEffect(() => {
    const token =
      localStorage.getItem("authToken") || localStorage.getItem("token");

    // Only verify if we have a token but Redux says we're not authenticated
    if (token && !isAuthenticated && !loading) {
      dispatch(verifyAuth());
    }
  }, [dispatch, isAuthenticated, loading]);

  return null; // This component doesn't render anything
}
