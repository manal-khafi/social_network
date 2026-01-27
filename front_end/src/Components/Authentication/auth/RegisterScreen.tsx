import React, { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAppDispatch } from "../../../hooks";
import { setAuth, setAuthError, setAuthLoading } from "../../../features/auth/authSlice";
import api from "../../../api/axios";
import { AuthInput } from "./AuthInput";
import { AuthButton } from "./AuthButton";
import { SocialButton } from "./SocialButton";
import { handleSocialAuth } from "./socialAuth";
import { Logo } from "./Logo";
import { toast } from "sonner";

interface RegisterScreenProps {
  onSwitchToLogin: () => void;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({ onSwitchToLogin }) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    display_name: "",
    email: "",
    password: "",
    confirmPassword: "",
    date_of_birth: "",
    account_name: "",
    adresse: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const goNextAfterAuth = (user?: any) => {
    if (user?.onboarding_done === false) {
      navigate("/personalize");
    } else {
      navigate("/home");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    dispatch(setAuthLoading());

    try {
      const response = await api.post("/authentication", formData);
      const data = response.data;

      if (!data?.success) {
        const msg = data?.message || "Registration failed. Please try again.";
        toast.error(msg);
        dispatch(setAuthError(msg));
        return;
      }

      toast.success(
        data.message ||
          "Account created successfully! Please check your email to verify your account."
      );

      // Registration flow: you may require email verification then login
      onSwitchToLogin();
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.message || "Server error. Please try again later.";
      toast.error(errorMsg);
      dispatch(setAuthError(errorMsg));
      console.error("Registration error:", error);
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
        const msg = "Social registration failed";
        toast.error(msg);
        dispatch(setAuthError(msg));
        return;
      }

      if (!data.token) {
        const msg = "Social auth succeeded but missing token in response.";
        toast.error(msg);
        dispatch(setAuthError(msg));
        return;
      }

      // ✅ Store BACKEND JWT only
      dispatch(setAuth({ token: data.token, user: data.user ?? null }));

      goNextAfterAuth(data.user);
      toast.success(`Successfully signed up with ${provider}`);
    } catch (error: any) {
      const msg =
        error.response?.data?.message || error.message || "Social registration failed";
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
          Join our community today!
        </motion.p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <AuthInput
          label="Username (Unique)"
          type="text"
          placeholder="Choose a unique username"
          value={formData.username}
          onChange={(e) =>
            setFormData({
              ...formData,
              username: e.target.value.replace(/\s/g, ""),
            })
          }
          required
        />

        <AuthInput
          label="Full Name"
          type="text"
          placeholder="Enter your full name"
          value={formData.display_name}
          onChange={(e) =>
            setFormData({ ...formData, display_name: e.target.value })
          }
          required
        />

        <AuthInput
          label="Email"
          type="email"
          placeholder="Enter your email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
        />

        <AuthInput
          label="Password"
          type="password"
          placeholder="Create a password"
          value={formData.password}
          onChange={(e) => {
            setFormData({ ...formData, password: e.target.value });
            if (errors.password) setErrors({ ...errors, password: "" });
          }}
          error={errors.password}
          required
        />

        <AuthInput
          label="Confirm Password"
          type="password"
          placeholder="Confirm your password"
          value={formData.confirmPassword}
          onChange={(e) => {
            setFormData({ ...formData, confirmPassword: e.target.value });
            if (errors.confirmPassword) {
              setErrors({ ...errors, confirmPassword: "" });
            }
          }}
          error={errors.confirmPassword}
          required
        />

        <AuthInput
          label="Adresse"
          type="text"
          placeholder="Enter your adresse"
          value={formData.adresse}
          onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
          required
        />

        <AuthInput
          label="date_of_birth"
          type="date"
          placeholder="Enter your birthday date"
          value={formData.date_of_birth}
          onChange={(e) =>
            setFormData({ ...formData, date_of_birth: e.target.value })
          }
          required
        />

        <AuthButton variant="primary" isLoading={isLoading} type="submit">
          Create Account
        </AuthButton>
      </form>

      <div className="my-6 flex items-center gap-4">
        <div className="flex-1 h-px bg-gray-300" />
        <span className="text-sm text-gray-500">or</span>
        <div className="flex-1 h-px bg-gray-300" />
      </div>

      <div className="space-y-3">
        <SocialButton provider="google" onClick={() => onSocialAuth("google")} />
        <SocialButton provider="facebook" onClick={() => onSocialAuth("facebook")} />
      </div>

      <div className="mt-6 text-center">
        <p className="text-gray-600">
          Already have an account?{" "}
          <button
            onClick={onSwitchToLogin}
            className="text-[#d6955b] hover:text-[#c8864d] transition-colors"
            type="button"
          >
            Login
          </button>
        </p>
      </div>
    </motion.div>
  );
};
