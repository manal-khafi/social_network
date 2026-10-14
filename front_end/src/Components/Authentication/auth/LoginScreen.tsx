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
  // Set when the backend answers the password step with a 2FA challenge.
  const [twoFactorToken, setTwoFactorToken] = useState<string | null>(null);
  const [twoFactorCode, setTwoFactorCode] = useState("");

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

      // Account protected by 2FA: no token yet, ask for the authenticator code.
      if (data.requiresTwoFactor && data.twoFactorToken) {
        setTwoFactorToken(data.twoFactorToken);
        setTwoFactorCode("");
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
      dispatch(setAuth({ token: data.token, user: data.user ?? null }));

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

  const cancelTwoFactor = () => {
    setTwoFactorToken(null);
    setTwoFactorCode("");
    setFormData((prev) => ({ ...prev, password: "" }));
  };

  const handleTwoFactorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsLoading(true);
    dispatch(setAuthLoading());

    try {
      const response = await api.post("/auth/2fa/verify-login", {
        twoFactorToken,
        code: twoFactorCode,
      });

      const data = response.data;

      if (!data?.success || !data.token) {
        const msg = data?.message || "Login failed";
        toast.error(msg);
        dispatch(setAuthError(msg));
        return;
      }

      toast.success(data.message || "Logged in successfully!");
      dispatch(setAuth({ token: data.token, user: data.user ?? null }));
      goNextAfterAuth(data.user, data.redirectTo);
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.message || "Server error. Please try again later.";
      toast.error(errorMsg);
      dispatch(setAuthError(errorMsg));
      setTwoFactorCode("");
      // Challenge expired or no longer valid: back to the password step.
      if (error.response?.status === 401) cancelTwoFactor();
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
      dispatch(setAuth({ token: data.token, user: data.user ?? null }));

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

  if (twoFactorToken) {
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
          <p className="text-gray-600">
            Enter the 6-digit code from your authenticator app.
          </p>
        </div>

        <form onSubmit={handleTwoFactorSubmit} className="space-y-5">
          <AuthInput
            label="Authentication code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            maxLength={6}
            placeholder="123456"
            value={twoFactorCode}
            onChange={(e) =>
              setTwoFactorCode(e.target.value.replace(/\D/g, "").slice(0, 6))
            }
            autoFocus
            required
          />

          <AuthButton variant="primary" isLoading={isLoading} type="submit">
            Verify
          </AuthButton>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={cancelTwoFactor}
            className="text-sm text-[#226d68] hover:text-[#18534f] transition-colors"
            type="button"
          >
            Back to login
          </button>
        </div>
      </motion.div>
    );
  }

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
