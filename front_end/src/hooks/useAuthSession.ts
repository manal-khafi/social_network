import { useEffect, useRef, useState } from "react";
import { useAppDispatch } from "../hooks";
// import { setCredentials, updateToken, logout } from "../features/auth/authSlice"; // No longer needed directly here
// import api from "../api/axios"; // No longer needed directly here

export const useAuthSession = () => {
  const dispatch = useAppDispatch();
  const [isSessionLoading, setIsSessionLoading] = useState(false); // Default to false, as session will be handled by global listener
  const didRun = useRef(false);

  useEffect(() => {
    // This hook primarily exists to provide an isSessionLoading flag,
    // which will be managed by the global onAuthStateChanged listener.
    // The previous rehydrateSession logic is removed as Firebase handles persistence.

    // If there's any initial loading state needed before onAuthStateChanged fires,
    // it should be set here, but for now, we assume Firebase is quick.
    // The actual authentication state is now managed globally.

  }, [dispatch]);

  return { isSessionLoading };
};

