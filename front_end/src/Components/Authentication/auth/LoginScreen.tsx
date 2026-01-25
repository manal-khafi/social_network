import React, { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAppDispatch } from "../../../hooks";
import {
  setAuth,
  setAuthError,
  setAuthLoading,
} from "../../../features/auth/authSlice";
import api from "../../../api/axios";
import { AuthInput } from "./AuthInput";
import { AuthButton } from "./AuthButton";
import { SocialButton } from "./SocialButton";
import { handleSocialAuth } from "./socialAuth";
import { Logo } from "./Logo";
import { toast } from "sonner";

interface LoginScreenProps {
  onSwitchToRegister: () => void;
  onSwitchToForgotPassword: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onSwitchToRegister,
  onSwitchToForgotPassword,
}) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    emailOrUsername: "",
    password: "",
  });

  const goNextAfterAuth = (_user?: any, redirectTo?: string) => {
    if (redirectTo && redirectTo !== "/personalize") {
      navigate(redirectTo);
      return;
    }
    navigate("/home");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsLoading(true);
    dispatch(setAuthLoading());

    try {
      const response = await api.post("/authentication/login", {
        email: formData.emailOrUsername,
        password: formData.password,
      });

      const data = response.data;

      if (!data?.success) {
        const msg = data?.message || "Login failed";
        toast.error(msg);
        dispatch(setAuthError(msg));
        return;
      }

      if (!data.token) {
        const msg = "Login succeeded but missing token in response.";
        toast.error(msg);
        dispatch(setAuthError(msg));
        return;
      }

      toast.success(data.message || "Logged in successfully!");

      // ✅ Store BACKEND JWT only. Firebase user is not involved in password login.
      dispatch(setAuth({ firebaseUser: null, token: data.token }));

      goNextAfterAuth(data.user, data.redirectTo);
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.message || "Server error. Please try again later.";
      toast.error(errorMsg);
      dispatch(setAuthError(errorMsg));
    } finally {
      setIsLoading(false);
    }
  };

  const onSocialAuth = async (provider: "google" | "facebook") => {
    try {
      setIsLoading(true);
      dispatch(setAuthLoading());

      const data = await handleSocialAuth(provider);

      if (!data?.success) {
        const msg = data?.message || "Social login failed";
        toast.error(msg);
        dispatch(setAuthError(msg));
        return;
      }

      if (!data.token) {
        const msg = "Social login succeeded but missing token in response.";
        toast.error(msg);
        dispatch(setAuthError(msg));
        return;
      }

      // ✅ Store BACKEND JWT only. Firebase user stays out of Redux.
      dispatch(setAuth({ firebaseUser: null, token: data.token }));

      goNextAfterAuth(data.user, data.redirectTo);
      toast.success(`Successfully logged in with ${provider}`);
    } catch (error: any) {
      const msg =
        error.response?.data?.message || error.message || "Social login failed";
      toast.error(msg);
      dispatch(setAuthError(msg));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-md"
    >
      <div className="text-center mb-8">
        <Logo />
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-gray-600"
        >
          Welcome back! Please login to your account.
        </motion.p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <AuthInput
          label="Email or Username"
          type="text"
          placeholder="Enter your email or username"
          value={formData.emailOrUsername}
          onChange={(e) =>
            setFormData({ ...formData, emailOrUsername: e.target.value })
          }
          required
        />

        <AuthInput
          label="Password"
          type="password"
          placeholder="Enter your password"
          value={formData.password}
          onChange={(e) =>
            setFormData({ ...formData, password: e.target.value })
          }
          required
        />

        <div className="flex justify-end">
          <button
            type="button"
            onClick={onSwitchToForgotPassword}
            className="text-sm text-[#226d68] hover:text-[#18534f] transition-colors"
          >
            Forgot password?
          </button>
        </div>

        <AuthButton variant="primary" isLoading={isLoading} type="submit">
          Login
        </AuthButton>
      </form>

      <div className="my-6 flex items-center gap-4">
        <div className="flex-1 h-px bg-gray-300" />
        <span className="text-sm text-gray-500">or</span>
        <div className="flex-1 h-px bg-gray-300" />
      </div>

      <div className="space-y-3">
        <SocialButton provider="google" onClick={() => onSocialAuth("google")} />
        <SocialButton
          provider="facebook"
          onClick={() => onSocialAuth("facebook")}
        />
      </div>

      <div className="mt-6 text-center">
        <p className="text-gray-600">
          Don't have an account?{" "}
          <button
            onClick={onSwitchToRegister}
            className="text-[#d6955b] hover:text-[#c8864d] transition-colors"
            type="button"
          >
            Sign up
          </button>
        </p>
      </div>
    </motion.div>
  );
};
