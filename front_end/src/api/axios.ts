// front_end/src/api/axios.ts
import axios from "axios";
import { store } from "../store";
import { logout, setAuth } from "../features/auth/authSlice";

const AUTH_STORAGE_KEY = "auth_session";

const readPersistedAuth = () => {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return { token: null };
    const parsed = JSON.parse(raw) as { token?: string };
    return {
      token: parsed.token ?? null,
    };
  } catch {
    return { token: null };
  }
};

const rawBaseURL = import.meta.env.VITE_API_URL || "http://localhost:3500";
const baseURL = rawBaseURL.endsWith("/api") ? rawBaseURL : `${rawBaseURL}/api`;

const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const url = config.url ?? "";
  if (url.includes("/authentication/social-login")) {
    return config;
  }
  let token = store.getState().auth.token;
  if (!token) {
    const persisted = readPersistedAuth();
    if (persisted.token) {
      token = persisted.token;
      const currentUser = store.getState().auth.user;
      store.dispatch(setAuth({ token: persisted.token, user: currentUser ?? null }));
    }
  }
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
    console.log("DEBUG: Axios sending BACKEND JWT length:", token.length); 
  } else {
    console.log("DEBUG: No BACKEND JWT found in store.");
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    const newToken = response.headers?.["x-access-token"];
    if (newToken) {
      const currentUser = store.getState().auth.user;
      store.dispatch(setAuth({ token: newToken, user: currentUser ?? null }));
    }
    return response;
  },
  async (error) => {
    const status = error.response?.status;
    const url = error.config?.url ?? "";

    if (status === 401 && !url.includes("/authentication/me")) {
      store.dispatch(logout());
    }

    return Promise.reject(error);
  }
);

export default api;
