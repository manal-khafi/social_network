import { useEffect, useRef, useState } from "react";
import { useAppDispatch } from "../hooks";
import api from "../api/axios";
import { setAuth, setAuthLoading, logout } from "../features/auth/authSlice";

const AUTH_STORAGE_KEY = "auth_session";

const readPersistedAuth = () => {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return { token: null, user: null };
    const parsed = JSON.parse(raw) as { token?: string; user?: any };
    return {
      token: parsed.token ?? null,
      user: parsed.user ?? null,
    };
  } catch {
    return { token: null, user: null };
  }
};

export const useAuthSession = () => {
  const dispatch = useAppDispatch();
  const [isSessionLoading, setIsSessionLoading] = useState(false);
  const didRun = useRef(false);

  useEffect(() => {
    if (didRun.current) return;
    didRun.current = true;

    const rehydrateSession = async () => {
      setIsSessionLoading(true);
      dispatch(setAuthLoading());

      const persisted = readPersistedAuth();
      if (!persisted.token) {
        dispatch(logout());
        setIsSessionLoading(false);
        return;
      }

      try {
        const response = await api.get("/authentication/me");
        const tokenFromHeader = response.headers?.["x-access-token"];
        const tokenFromBody = response.data?.token;
        const token = tokenFromBody || tokenFromHeader || null;

        if (response.data?.success && token) {
          dispatch(
            setAuth({
              token,
              user: response.data.user ?? null,
            })
          );
        } else {
          // Keep persisted auth if backend does not return a token
          dispatch(
            setAuth({
              token: persisted.token,
              user: persisted.user ?? null,
            })
          );
        }
      } catch (error) {
        // Network/CORS errors shouldn't wipe persisted session immediately
        dispatch(
          setAuth({
            token: persisted.token,
            user: persisted.user ?? null,
          })
        );
      } finally {
        setIsSessionLoading(false);
      }
    };

    rehydrateSession();
  }, [dispatch]);

  return { isSessionLoading };
};

