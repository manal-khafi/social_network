import axios from "axios";
import { store } from "../store";
import { logout } from "../features/auth/authSlice"; 

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
  const token = store.getState().auth.token;
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
  (response) => response,
  async (error) => {
    const status = error.response?.status;

    if (status === 401) {
      store.dispatch(logout());
    }

    return Promise.reject(error);
  }
);

export default api;
